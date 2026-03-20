import { render, screen } from '@testing-library/react';
import RecommendationList from '../RecommendationList';

describe('RecommendationList', () => {
  it('shows empty state when list is empty', () => {
    render(<RecommendationList recommendations={[]} />);

    expect(screen.getByText('No recommendations at this time.')).toBeInTheDocument();
  });

  it('renders recommendations with labels and text', () => {
    const recommendations = [
      { priority: 'HIGH', type: 'UPGRADE', text: 'Upgrade SSD to NVMe for better performance' },
      { priority: 'MEDIUM', type: 'MONITOR', text: 'Monitor CPU temperature under heavy load' }
    ];

    render(<RecommendationList recommendations={recommendations} />);

    expect(screen.getByText('HIGH PRIORITY')).toBeInTheDocument();
    expect(screen.getByText('UPGRADE')).toBeInTheDocument();
    expect(screen.getByText('Upgrade SSD to NVMe for better performance')).toBeInTheDocument();
    expect(screen.getByText('Monitor CPU temperature under heavy load')).toBeInTheDocument();
  });
});
