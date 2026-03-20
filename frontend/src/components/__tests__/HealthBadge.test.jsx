import { render, screen } from '@testing-library/react';
import HealthBadge from '../HealthBadge';

describe('HealthBadge', () => {
  it('renders provided health value', () => {
    render(<HealthBadge health="GOOD" />);

    expect(screen.getByText('GOOD')).toBeInTheDocument();
  });

  it('falls back to UNKNOWN when health is nullish', () => {
    render(<HealthBadge health={null} />);

    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});
