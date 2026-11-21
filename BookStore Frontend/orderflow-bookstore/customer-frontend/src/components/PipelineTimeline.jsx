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
  let earlierStageFailed = false;

  const resolvedStages = PIPELINE_STAGES.map((stage) => {
    const matchingEvents = auditEvents.filter((event) => {
      const key = normalizeStepKey(event.stepName);
      return key === stage.key || key.includes(stage.key);
    });

    if (matchingEvents.length === 0) {
      const message = earlierStageFailed
        ? 'Skipped because an earlier step could not be completed.'
        : orderStatus === 'FAILED'
          ? 'Not completed.'
          : 'Waiting for earlier step.';
      return {
        ...stage,
        status: 'NOT EXECUTED',
        cardVariant: 'cf-stage-card-not-executed',
        message,
        timestamp: null,
      };
    }

    const failedEvent = matchingEvents.find(
      (e) => String(e.executionStatus).toUpperCase() === 'FAILED'
    );
    if (failedEvent) {
      earlierStageFailed = true;
      return {
        ...stage,
        status: 'FAILED',
        cardVariant: 'cf-stage-card-failed',
        message: failedEvent.message || 'This step could not be completed.',
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

  return (
    <section className="cf-card" aria-label="Order progress steps">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="cf-section-title">Order Progress</h2>
          <p className="cf-section-desc" style={{ marginBottom: 0 }}>
            Your order moves through six step-by-step checks. If any step cannot be completed, later steps are skipped.
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
              {stage.timestamp ? stage.timestamp : 'Not started yet'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
