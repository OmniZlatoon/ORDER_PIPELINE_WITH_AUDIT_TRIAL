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

  const stages = PIPELINE_STAGES.map((stage) => {
    const matching = auditEvents.filter((event) => {
      const key = normalizeStepKey(event.stepName);
      return key === stage.key || key.includes(stage.key);
    });

    if (matching.length === 0) {
      return {
        ...stage,
        status: 'NOT EXECUTED',
        cardClass: 'af-stage-card-not-executed',
        message: earlierStageFailed
          ? 'Skipped because an earlier step could not be completed.'
          : orderStatus === 'FAILED'
            ? 'Not completed.'
            : 'No activity recorded.',
        timestamp: null,
      };
    }

    const failedEvent = matching.find((e) => String(e.executionStatus).toUpperCase() === 'FAILED');
    if (failedEvent) {
      earlierStageFailed = true;
      return {
        ...stage,
        status: 'FAILED',
        cardClass: 'af-stage-card-failed',
        message: failedEvent.message || 'This step could not be completed.',
        timestamp: formatTimestamp(failedEvent.createdAt),
      };
    }

    const successEvent = matching.find((e) => String(e.executionStatus).toUpperCase() === 'SUCCESS');
    if (successEvent) {
      return {
        ...stage,
        status: 'SUCCESS',
        cardClass: 'af-stage-card-success',
        message: successEvent.message || 'Step completed successfully.',
        timestamp: formatTimestamp(successEvent.createdAt),
      };
    }

    const startedEvent = matching[matching.length - 1];
    return {
      ...stage,
      status: 'STARTED',
      cardClass: 'af-stage-card-started',
      message: startedEvent.message || 'Step started.',
      timestamp: formatTimestamp(startedEvent.createdAt),
    };
  });

  return (
    <section className="af-card" aria-label="Order progress steps">
      <h2 className="af-section-title">Order Progress</h2>
      <p className="af-section-desc" style={{ marginBottom: 0 }}>
        Each order moves through six sequential steps. If any step fails, later steps are skipped.
      </p>

      <div className="af-pipeline-grid">
        {stages.map((stage) => (
          <div key={stage.key} className={`af-stage-card ${stage.cardClass}`}>
            <span className="af-stage-step">Step {stage.number}</span>
            <h3 className="af-stage-name">{stage.name}</h3>
            <div>
              <StatusBadge status={stage.status} />
            </div>
            <p className="af-stage-msg">{stage.message}</p>
            <div className="af-stage-time">
              {stage.timestamp ? stage.timestamp : 'Not completed'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
