import StatusBadge from './StatusBadge';

const PIPELINE_STAGES = [
  { key: 'validateorder', number: '01', name: 'Validate Order' },
  { key: 'checkinventory', number: '02', name: 'Check Inventory' },
  { key: 'calculatetotal', number: '03', name: 'Calculate Total' },
  { key: 'processpayment', number: '04', name: 'Process Payment' },
  { key: 'confirmorder', number: '05', name: 'Confirm Order' },
  { key: 'completeorder', number: '06', name: 'Complete Order' },
];

function normalizeStepKey(stepName) {
  return String(stepName || '')
    .toLowerCase()
    .replace(/^\d+[\s._-]*/, '')
    .replace(/[^a-z]/g, '');
}

function formatTimestamp(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

export default function PipelineTimeline({ auditEvents = [], orderStatus }) {
  const upperOrderStatus = String(orderStatus || '').toUpperCase();
  let failedStageInfo = null;

  const rawStages = PIPELINE_STAGES.map((stage) => {
    // Once any stage fails, immediately stop and end all remaining stages.
    if (failedStageInfo) {
      return {
        ...stage,
        status: 'NOT EXECUTED',
        cardVariant: 'cf-stage-card-not-executed',
        message: `Ended automatically because Step ${failedStageInfo.number} (${failedStageInfo.name}) failed.`,
        timestamp: null,
      };
    }

    const matchingEvents = auditEvents.filter((event) => {
      const key = normalizeStepKey(event.stepName);
      return key === stage.key || key.includes(stage.key);
    });

    if (matchingEvents.length === 0) {
      return {
        ...stage,
        status: upperOrderStatus === 'COMPLETED' ? 'SUCCESS' : 'NOT EXECUTED',
        cardVariant: upperOrderStatus === 'COMPLETED' ? 'cf-stage-card-success' : 'cf-stage-card-not-executed',
        message: upperOrderStatus === 'COMPLETED' ? 'Step completed.' : 'Waiting for earlier step.',
        timestamp: null,
      };
    }

    const failedEvent = matchingEvents.find(
      (e) => String(e.executionStatus).toUpperCase() === 'FAILED'
    );
    if (failedEvent) {
      failedStageInfo = {
        number: stage.number,
        name: stage.name,
      };
      return {
        ...stage,
        status: 'FAILED',
        cardVariant: 'cf-stage-card-failed',
        message: failedEvent.message || 'This step failed and ended the order process.',
        timestamp: formatTimestamp(failedEvent.createdAt),
      };
    }

    const successEvent = matchingEvents.find(
      (e) => String(e.executionStatus).toUpperCase() === 'SUCCESS'
    );
    if (successEvent) {
      return {
        ...stage,
        status: 'SUCCESS',
        cardVariant: 'cf-stage-card-success',
        message: successEvent.message || 'Step completed.',
        timestamp: formatTimestamp(successEvent.createdAt),
      };
    }

    const startedEvent = matchingEvents[matchingEvents.length - 1];
    return {
      ...stage,
      status: 'STARTED',
      cardVariant: 'cf-stage-card-started',
      message: startedEvent.message || 'Step in progress.',
      timestamp: formatTimestamp(startedEvent.createdAt),
    };
  });

  // Fallback if the order status is FAILED without a FAILED audit record on any step.
  let resolvedStages = rawStages;
  if (upperOrderStatus === 'FAILED' && !failedStageInfo) {
    let forced = false;
    resolvedStages = rawStages.map((stage) => {
      if (forced) {
        return {
          ...stage,
          status: 'NOT EXECUTED',
          cardVariant: 'cf-stage-card-not-executed',
          message: `Ended automatically because Step ${failedStageInfo.number} (${failedStageInfo.name}) failed.`,
          timestamp: null,
        };
      }
      if (stage.status === 'STARTED' || stage.status === 'NOT EXECUTED') {
        forced = true;
        failedStageInfo = { number: stage.number, name: stage.name };
        return {
          ...stage,
          status: 'FAILED',
          cardVariant: 'cf-stage-card-failed',
          message: 'This step failed and automatically ended the remaining order process.',
        };
      }
      return stage;
    });
  }

  return (
    <section className="cf-card" aria-label="Order progress steps">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="cf-section-title">Order Progress</h2>
          <p className="cf-section-desc" style={{ marginBottom: 0 }}>
            {failedStageInfo
              ? `The order pipeline stopped at Step ${failedStageInfo.number} (${failedStageInfo.name}). That step is marked failed and the remaining process ended automatically.`
              : 'Your order moves through six step-by-step checks. If any step fails, it is marked failed and the entire remaining process ends automatically.'}
          </p>
        </div>
      </div>

      <div className="cf-pipeline-grid">
        {resolvedStages.map((stage) => (
          <div key={stage.key} className={`cf-stage-card ${stage.cardVariant}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span className="cf-stage-step-num">Step {stage.number}</span>
            </div>
            <h3 className="cf-stage-name">{stage.name}</h3>
            <div>
              <StatusBadge status={stage.status} />
            </div>
            <p className="cf-stage-message">{stage.message}</p>
            <div className="cf-stage-time">
              {stage.timestamp ? stage.timestamp : stage.status === 'FAILED' ? 'Process ended' : 'Not executed'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
