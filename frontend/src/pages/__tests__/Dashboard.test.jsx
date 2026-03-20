import { render, screen } from '@testing-library/react';
import Dashboard from '../Dashboard';

vi.mock('../../components/LiveMonitor', () => ({
  default: () => <div>LiveMonitor Mock</div>
}));

vi.mock('../../hooks/useLiveEvaluation', () => ({
  default: () => ({
    evaluation: {
      evaluationModel: 'STANDARDIZED_HARDWARE_REUSABILITY',
      standardized: {
        totalScore: 84,
        classification: {
          level: 'Reusable',
          tier: 'REUSABLE'
        },
        categories: {
          functionalIntegrity: { label: 'Functional Integrity', score: 34, maxScore: 40, percentage: 85 },
          performanceRetention: { label: 'Performance Retention', score: 24, maxScore: 30, percentage: 80 },
          remainingLife: { label: 'Remaining Life / Wear Level', score: 16, maxScore: 20, percentage: 80 },
          physicalThermal: { label: 'Physical & Thermal Condition', score: 10, maxScore: 10, percentage: 100 }
        },
        recommendedActions: [
          { priority: 'HIGH', action: 'Run module diagnostics', description: 'Check keyboard, GPU, Bluetooth, WiFi and Sound health regularly.' }
        ]
      },
      overall: {
        health: 'FAIR',
        total_score: 84
      }
    },
    connectionStatus: 'connected',
    lastUpdate: new Date().toISOString(),
    isConnected: true
  })
}));

describe('Dashboard page', () => {
  it('renders standardized dashboard and recommendations', () => {
    render(<Dashboard />);

    expect(screen.getByText('Hardware Evaluation Dashboard')).toBeInTheDocument();
    expect(screen.getByText('LiveMonitor Mock')).toBeInTheDocument();
    expect(screen.getByText('Current Evaluation')).toBeInTheDocument();
    expect(screen.getByText('Category Performance')).toBeInTheDocument();
    expect(screen.getByText('Run module diagnostics')).toBeInTheDocument();
  });
});
