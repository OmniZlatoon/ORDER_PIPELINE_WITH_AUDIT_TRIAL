import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Slash,
  Truck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchOrderAuditHistory, fetchOrderNotifications } from '../api/auditApi';
import { extractApiError } from '../api/axiosClient';
import { lookupOrder } from '../api/orderApi';
import AuditTimeline from './AuditTimeline';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import ObserverStatus from './ObserverStatus';
import OrderSummary from './OrderSummary';
import PipelineTimeline from './PipelineTimeline';
import StatusBadge from './StatusBadge';

const PIPELINE_STEPS = [
  { key: 'validateorder', number: '01', name: 'Validate Order' },
  { key: 'checkinventory', number: '02', name: 'Check Inventory' },
  { key: 'calculatetotal', number: '03', name: 'Calculate Total' },
  { key: 'processpayment', number: '04', name: 'Process Payment' },
  { key: 'confirmorder', number: '05', name: 'Confirm Order' },
  { key: 'completeorder', number: '06', name: 'Complete Order' },
];

const RECENT_TRACKED_KEY = 'orderflow_recent_tracked_orders_v1';

function normalizeStepKey(stepName) {
  return String(stepName || '')
    .toLowerCase()
    .replace(/^\d+[\s._-]*/, '')
    .replace(/[^a-z]/g, '');
}

function readRecentTrackedIds() {
  try {
    const raw = window.sessionStorage.getItem(RECENT_TRACKED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentTrackedId(idValue) {
  const clean = String(idValue || '').trim();
  if (!clean) {
    return [];
  }
  const existing = readRecentTrackedIds();
  const updated = [clean, ...existing.filter((item) => item !== clean)].slice(0, 5);
  try {
    window.sessionStorage.setItem(RECENT_TRACKED_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors.
  }
  return updated;
}

function computePipelineSummary(auditEvents, orderStatus) {
  const upperStatus = String(orderStatus || '').toUpperCase();
  let failedStageInfo = null;

  const rawStages = PIPELINE_STEPS.map((stage) => {
    // Fail-fast: once any process fails, automatically end all subsequent steps.
    if (failedStageInfo) {
      return {
        ...stage,
        state: 'ENDED',
        message: `Ended automatically because Step ${failedStageInfo.number} (${failedStageInfo.name}) failed.`,
      };
    }

    const matching = auditEvents.filter((event) => {
      const key = normalizeStepKey(event.stepName);
      return key === stage.key || key.includes(stage.key);
    });

    if (matching.length === 0) {
      return {
        ...stage,
        state: upperStatus === 'COMPLETED' ? 'SUCCESS' : 'PENDING',
        message: upperStatus === 'COMPLETED' ? 'Completed' : 'Waiting in queue',
      };
    }

    const failed = matching.find((e) => String(e.executionStatus).toUpperCase() === 'FAILED');
    if (failed) {
      failedStageInfo = {
        number: stage.number,
        name: stage.name,
        message: failed.message || `${stage.name} failed.`,
      };
      return {
        ...stage,
        state: 'FAILED',
        message: failed.message || 'Process failed — pipeline ended.',
      };
    }

    const success = matching.find((e) => String(e.executionStatus).toUpperCase() === 'SUCCESS');
    if (success) {
      return {
        ...stage,
        state: 'SUCCESS',
        message: success.message || 'Completed',
      };
    }

    const latest = matching[matching.length - 1];
    return {
      ...stage,
      state: 'ACTIVE',
      message: latest.message || 'In progress',
    };
  });

  // If the order itself failed without an explicit FAILED stage record, mark the active or next incomplete step as FAILED and end the rest.
  let stages = rawStages;
  if (upperStatus === 'FAILED' && !failedStageInfo) {
    let forcedFailApplied = false;
    stages = rawStages.map((stage) => {
      if (forcedFailApplied) {
        return {
          ...stage,
          state: 'ENDED',
          message: `Ended automatically because Step ${failedStageInfo.number} (${failedStageInfo.name}) failed.`,
        };
      }
      if (stage.state === 'ACTIVE' || stage.state === 'PENDING') {
        forcedFailApplied = true;
        failedStageInfo = {
          number: stage.number,
          name: stage.name,
          message: stage.state === 'ACTIVE' ? stage.message : `${stage.name} could not be completed.`,
        };
        return {
          ...stage,
          state: 'FAILED',
          message: failedStageInfo.message,
        };
      }
      return stage;
    });

    if (!forcedFailApplied && stages.length > 0) {
      const lastIndex = stages.length - 1;
      const last = stages[lastIndex];
      failedStageInfo = {
        number: last.number,
        name: last.name,
        message: `${last.name} failed.`,
      };
      stages = stages.map((s, idx) =>
        idx === lastIndex ? { ...s, state: 'FAILED', message: failedStageInfo.message } : s
      );
    }
  }

  const completedCount = stages.filter((s) => s.state === 'SUCCESS').length;
  const failedStage = stages.find((s) => s.state === 'FAILED') || null;
  const activeStage = stages.find((s) => s.state === 'ACTIVE') || null;
  const nextPendingStage = stages.find((s) => s.state === 'PENDING') || null;
  const hasFailure = Boolean(failedStage) || upperStatus === 'FAILED';
  const isCompleted = !hasFailure && (upperStatus === 'COMPLETED' || completedCount === PIPELINE_STEPS.length);

  let currentStageLabel = 'Queued for Validation';
  let currentStepNumber = '01';
  let currentStageDescription = 'Order is waiting to enter the first verification step.';

  if (failedStage) {
    currentStageLabel = `Failed at ${failedStage.name}`;
    currentStepNumber = failedStage.number;
    currentStageDescription = failedStage.message;
  } else if (isCompleted) {
    currentStageLabel = 'Complete Order';
    currentStepNumber = '06';
    currentStageDescription = 'All six steps finished. Your package is confirmed and ready for dispatch.';
  } else if (activeStage) {
    currentStageLabel = activeStage.name;
    currentStepNumber = activeStage.number;
    currentStageDescription = activeStage.message;
  } else if (completedCount > 0 && nextPendingStage) {
    currentStageLabel = nextPendingStage.name;
    currentStepNumber = nextPendingStage.number;
    currentStageDescription = `${completedCount} of 6 steps completed. Next up: ${nextPendingStage.name}.`;
  } else if (completedCount > 0) {
    const lastDone = stages[completedCount - 1];
    currentStageLabel = lastDone.name;
    currentStepNumber = lastDone.number;
    currentStageDescription = lastDone.message;
  }

  const progressPercent = Math.round((completedCount / PIPELINE_STEPS.length) * 100);

  return {
    stages,
    completedCount,
    totalCount: PIPELINE_STEPS.length,
    progressPercent,
    hasFailure,
    failedStage,
    isCompleted,
    currentStageLabel,
    currentStepNumber,
    currentStageDescription,
  };
}

export default function OrderTrackingDashboard({ initialOrderId = '' }) {
  const [orderIdInput, setOrderIdInput] = useState(initialOrderId);
  const [recentIds, setRecentIds] = useState(() => readRecentTrackedIds());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchOrderSnapshot = useCallback(async (rawQuery, { silent = false } = {}) => {
    const trimmed = String(rawQuery || '').trim();
    if (!trimmed) {
      if (!silent) {
        setError('Please enter an Order ID (e.g. 104) or Order Reference (e.g. ORD-2026-00104).');
      }
      return;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const foundOrder = await lookupOrder(trimmed);
      setOrder(foundOrder);

      if (!silent) {
        const trackedKey = foundOrder.orderReference || String(foundOrder.orderId || trimmed);
        setRecentIds(saveRecentTrackedId(trackedKey));
      }

      const targetId = foundOrder.orderId;
      const [auditRes, notifRes] = await Promise.allSettled([
        fetchOrderAuditHistory(targetId),
        fetchOrderNotifications(targetId),
      ]);

      if (auditRes.status === 'fulfilled') {
        const sorted = [...auditRes.value].sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tA !== tB ? tA - tB : (Number(a.auditId) || 0) - (Number(b.auditId) || 0);
        });
        setAuditEvents(sorted);
      } else if (!silent) {
        setAuditEvents([]);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value);
      } else if (!silent) {
        setNotifications([]);
      }
    } catch (err) {
      if (!silent) {
        setOrder(null);
        setAuditEvents([]);
        setNotifications([]);
        const normalized = extractApiError(err, `No package or order found matching "${trimmed}".`);
        setError(normalized.message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const initial = String(initialOrderId || '').trim();
    if (initial) {
      setOrderIdInput(initial);
      fetchOrderSnapshot(initial);
    }
  }, [initialOrderId, fetchOrderSnapshot]);

  const handleSubmit = (event) => {
    event.preventDefault();
    fetchOrderSnapshot(orderIdInput);
  };

  const handleQuickSelect = (savedId) => {
    setOrderIdInput(savedId);
    fetchOrderSnapshot(savedId);
  };

  const handleClear = () => {
    setOrderIdInput('');
    setError(null);
    setOrder(null);
    setAuditEvents([]);
    setNotifications([]);
  };

  const pipelineSummary = useMemo(
    () => (order ? computePipelineSummary(auditEvents, order.orderStatus) : null),
    [order, auditEvents]
  );

  // Automatically poll live updates while an order pipeline is still running,
  // and immediately stop polling once it completes OR any step fails (ending the process).
  useEffect(() => {
    if (!order || !pipelineSummary) {
      return undefined;
    }
    if (pipelineSummary.isCompleted || pipelineSummary.hasFailure) {
      return undefined;
    }

    const activeQuery = order.orderId || order.orderReference || orderIdInput;
    if (!activeQuery) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      fetchOrderSnapshot(activeQuery, { silent: true });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [order, pipelineSummary, orderIdInput, fetchOrderSnapshot]);

  const shippingNotice = useMemo(
    () => notifications.find((n) => String(n.notificationType).toUpperCase() === 'SHIPPING') || null,
    [notifications]
  );
  const emailNotice = useMemo(
    () => notifications.find((n) => String(n.notificationType).toUpperCase() === 'EMAIL') || null,
    [notifications]
  );

  const effectiveOrder = useMemo(() => {
    if (!order || !pipelineSummary) {
      return order;
    }
    if (pipelineSummary.hasFailure && String(order.orderStatus || '').toUpperCase() !== 'FAILED') {
      return {
        ...order,
        orderStatus: 'FAILED',
      };
    }
    return order;
  }, [order, pipelineSummary]);

  return (
    <div className="cf-tracking-dashboard">
      {/* Search & Control Panel */}
      <section className="cf-card cf-tracking-search-card" aria-label="Track your package by Order ID">
        <div className="cf-tracking-search-head">
          <div>
            <div className="cf-meta-line" style={{ marginBottom: 4 }}>
              <Package size={14} aria-hidden="true" />
              <span>Package &amp; Pipeline Status</span>
            </div>
            <h2 className="cf-section-title" style={{ marginBottom: 4 }}>
              Track an Order by ID
            </h2>
            <p className="cf-section-desc" style={{ marginBottom: 0 }}>
              Enter your numeric Order ID or Order Reference to view where your package stands across all six processing stages.
            </p>
          </div>

          {order ? (
            <button
              type="button"
              onClick={() => fetchOrderSnapshot(order.orderId || orderIdInput)}
              className="cf-btn cf-btn-secondary"
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'cf-spin' : ''} aria-hidden="true" />
              <span>Refresh Status</span>
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <label htmlFor="order-tracking-id-input" className="cf-label">
            Order ID or Order Reference
          </label>
          <div className="cf-tracking-input-row">
            <div className="cf-search-input-wrap" style={{ maxWidth: 'none', flex: 1 }}>
              <Search size={16} className="cf-search-icon" aria-hidden="true" />
              <input
                id="order-tracking-id-input"
                type="text"
                className="cf-input cf-input-pill cf-input-with-icon"
                placeholder="Enter Order ID (e.g. 104 or ORD-2026-00104)"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                aria-label="Order ID or Order Reference"
              />
            </div>

            {orderIdInput ? (
              <button
                type="button"
                onClick={handleClear}
                className="cf-btn cf-btn-ghost"
                aria-label="Clear Order ID"
              >
                <X size={15} aria-hidden="true" />
                <span>Clear</span>
              </button>
            ) : null}

            <button type="submit" className="cf-btn cf-btn-primary" disabled={loading}>
              <Search size={16} aria-hidden="true" />
              <span>{loading ? 'Checking Status...' : 'Track Package'}</span>
            </button>
          </div>
        </form>

        {recentIds.length > 0 ? (
          <div className="cf-tracking-recent-row" aria-label="Recently checked orders">
            <span className="cf-tracking-recent-label">Recently checked:</span>
            {recentIds.map((idItem) => (
              <button
                key={idItem}
                type="button"
                onClick={() => handleQuickSelect(idItem)}
                className="cf-tracking-recent-chip cf-mono"
              >
                {idItem}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="cf-card">
          <LoadingSpinner message="Fetching live package status and pipeline progress..." />
        </div>
      ) : null}

      {error ? (
        <ErrorMessage title="Unable to locate order" message={error} />
      ) : null}

      {!loading && !error && !order ? (
        <section className="cf-card cf-tracking-idle-card" aria-label="Package tracking overview">
          <div className="cf-tracking-idle-head">
            <div className="cf-tracking-idle-icon" aria-hidden="true">
              <Truck size={24} />
            </div>
            <div>
              <h3 className="cf-empty-title" style={{ margin: '0 0 4px', textAlign: 'left' }}>
                Ready to check your package
              </h3>
              <p className="cf-section-desc" style={{ marginBottom: 0 }}>
                Once you enter an Order ID above, this dashboard highlights your package&apos;s current stage across these six milestones. If any step fails, that step is marked as failed and the entire remaining process ends automatically:
              </p>
            </div>
          </div>

          <div className="cf-tracking-stepper" style={{ marginTop: 22 }}>
            {PIPELINE_STEPS.map((stage) => (
              <div key={stage.key} className="cf-tracking-step cf-tracking-step-idle">
                <div className="cf-tracking-step-node">
                  <Clock size={14} aria-hidden="true" />
                </div>
                <div className="cf-tracking-step-num cf-mono">Step {stage.number}</div>
                <div className="cf-tracking-step-name">{stage.name}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {effectiveOrder && pipelineSummary ? (
        <div className="cf-stack">
          {/* Fail-Fast / Completion Status Banner */}
          {pipelineSummary.hasFailure ? (
            <div className="cf-alert cf-alert-error" role="alert" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">
                    Process Failed at Step {pipelineSummary.currentStepNumber} — Entire Order Pipeline Ended
                  </p>
                  <p className="cf-alert-text">
                    {pipelineSummary.failedStage
                      ? `${pipelineSummary.failedStage.name} failed (${pipelineSummary.failedStage.message}). That step has been marked as failed and the rest of the order pipeline automatically ended without dispatching shipping or email notices.`
                      : 'A step in the order pipeline failed. The failed step is marked below and the entire remaining order process was automatically ended.'}
                  </p>
                </div>
              </div>
            </div>
          ) : pipelineSummary.isCompleted ? (
            <div className="cf-alert cf-alert-success" role="status" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">Order Pipeline Completed Successfully</p>
                  <p className="cf-alert-text">
                    All six order steps passed, and your package dispatch and confirmation email notifications have been triggered.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="cf-alert cf-alert-info" role="status" style={{ marginBottom: 0 }}>
              <div className="cf-alert-content">
                <Loader2 size={20} className="cf-spin" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div>
                  <p className="cf-alert-title">
                    Order Pipeline In Progress — {pipelineSummary.currentStageLabel}
                  </p>
                  <p className="cf-alert-text">
                    Checking live pipeline updates automatically. If any step fails, that step will be marked failed and the process will end immediately.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Package Pipeline Dashboard Overview */}
          <section className="cf-card cf-tracking-overview-card" aria-label="Package pipeline dashboard">
            <div className="cf-tracking-overview-top">
              <div>
                <div className="cf-meta-line">
                  <span className="cf-mono">Order #{effectiveOrder.orderId}</span>
                  {effectiveOrder.orderReference ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="cf-mono">{effectiveOrder.orderReference}</span>
                    </>
                  ) : null}
                  <span aria-hidden="true">·</span>
                  <span>Live Package Dashboard</span>
                </div>
                <h2 className="cf-section-title" style={{ fontSize: '1.45rem', marginBottom: 4 }}>
                  {pipelineSummary.hasFailure
                    ? `Process Ended: ${pipelineSummary.currentStageLabel}`
                    : `Current Stage: ${pipelineSummary.currentStageLabel}`}
                </h2>
                <p className="cf-section-desc" style={{ marginBottom: 0 }}>
                  {pipelineSummary.currentStageDescription}
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <StatusBadge
                  status={effectiveOrder.orderStatus}
                  label={`Order: ${effectiveOrder.orderStatus || 'PENDING'}`}
                />
                <StatusBadge
                  status={effectiveOrder.paymentStatus}
                  label={`Payment: ${effectiveOrder.paymentStatus || 'PENDING'}`}
                />
              </div>
            </div>

            {/* 4 Dashboard KPI Tiles */}
            <div className="cf-tracking-kpi-grid">
              <div className="cf-tracking-kpi">
                <div className="cf-stat-label">
                  {pipelineSummary.hasFailure ? 'Stopped At Step' : 'Current Package Stage'}
                </div>
                <div className="cf-tracking-kpi-value">
                  Step {pipelineSummary.currentStepNumber} of 06
                </div>
                <div className="cf-tracking-kpi-sub">
                  {pipelineSummary.failedStage ? `${pipelineSummary.failedStage.name} (Failed)` : pipelineSummary.currentStageLabel}
                </div>
              </div>

              <div className="cf-tracking-kpi">
                <div className="cf-stat-label">Pipeline Completion</div>
                <div className="cf-tracking-kpi-value cf-mono">
                  {pipelineSummary.completedCount} / {pipelineSummary.totalCount} Steps ({pipelineSummary.progressPercent}%)
                </div>
                <div
                  className="cf-tracking-progress-track"
                  role="progressbar"
                  aria-valuenow={pipelineSummary.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Order pipeline completion"
                >
                  <div
                    className={`cf-tracking-progress-fill ${pipelineSummary.hasFailure ? 'failed' : ''}`}
                    style={{ width: `${pipelineSummary.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="cf-tracking-kpi">
                <div className="cf-stat-label">Shipping Dispatch</div>
                <div className="cf-tracking-kpi-value">
                  {shippingNotice
                    ? 'Dispatch Scheduled'
                    : pipelineSummary.hasFailure
                      ? 'Ended — Not Scheduled'
                      : 'Awaiting Completion'}
                </div>
                <div className="cf-tracking-kpi-sub">
                  {shippingNotice
                    ? `Status: ${shippingNotice.status || 'SENT'}`
                    : pipelineSummary.hasFailure
                      ? 'Cancelled after pipeline failure'
                      : 'Triggered when order completes'}
                </div>
              </div>

              <div className="cf-tracking-kpi">
                <div className="cf-stat-label">Customer Email Notice</div>
                <div className="cf-tracking-kpi-value">
                  {emailNotice
                    ? 'Confirmation Sent'
                    : pipelineSummary.hasFailure
                      ? 'Ended — Not Sent'
                      : 'Awaiting Completion'}
                </div>
                <div className="cf-tracking-kpi-sub">
                  {emailNotice
                    ? `Status: ${emailNotice.status || 'SENT'}`
                    : pipelineSummary.hasFailure
                      ? 'Cancelled after pipeline failure'
                      : 'Sent once all 6 stages pass'}
                </div>
              </div>
            </div>

            {/* Horizontal Package Journey Stepper */}
            <div className="cf-tracking-stepper-wrap">
              <div className="cf-stat-label" style={{ marginBottom: 10 }}>
                Package Pipeline Position
              </div>
              <div className="cf-tracking-stepper">
                {pipelineSummary.stages.map((stage) => {
                  const stateClass =
                    stage.state === 'SUCCESS'
                      ? 'cf-tracking-step-success'
                      : stage.state === 'FAILED'
                        ? 'cf-tracking-step-failed'
                        : stage.state === 'ACTIVE'
                          ? 'cf-tracking-step-active'
                          : stage.state === 'ENDED'
                            ? 'cf-tracking-step-ended'
                            : 'cf-tracking-step-idle';

                  return (
                    <div key={stage.key} className={`cf-tracking-step ${stateClass}`}>
                      <div className="cf-tracking-step-node">
                        {stage.state === 'SUCCESS' ? (
                          <CheckCircle2 size={14} aria-hidden="true" />
                        ) : stage.state === 'FAILED' ? (
                          <AlertCircle size={14} aria-hidden="true" />
                        ) : stage.state === 'ACTIVE' ? (
                          <Loader2 size={14} className="cf-spin" aria-hidden="true" />
                        ) : stage.state === 'ENDED' ? (
                          <Slash size={13} aria-hidden="true" />
                        ) : (
                          <Clock size={14} aria-hidden="true" />
                        )}
                      </div>
                      <div className="cf-tracking-step-num cf-mono">Step {stage.number}</div>
                      <div className="cf-tracking-step-name">{stage.name}</div>
                      <div className="cf-tracking-step-state">
                        {stage.state === 'SUCCESS'
                          ? 'Completed'
                          : stage.state === 'FAILED'
                            ? 'Failed · Process Ended'
                            : stage.state === 'ACTIVE'
                              ? 'In Progress'
                              : stage.state === 'ENDED'
                                ? 'Ended (Skipped)'
                                : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <OrderSummary order={effectiveOrder} />
          <PipelineTimeline auditEvents={auditEvents} orderStatus={effectiveOrder.orderStatus} />
          <ObserverStatus notifications={notifications} pipelineFailed={pipelineSummary.hasFailure} />
          <AuditTimeline auditEvents={auditEvents} />
        </div>
      ) : null}
    </div>
  );
}
