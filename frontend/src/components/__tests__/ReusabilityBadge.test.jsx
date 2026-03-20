import { render, screen } from '@testing-library/react';
import ReusabilityBadge from '../ReusabilityBadge';

describe('ReusabilityBadge', () => {
  it('renders reusable state details', () => {
    render(<ReusabilityBadge reusable verdict="Reusable" confidence={92} />);

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Reusable')).toBeInTheDocument();
    expect(screen.getByText('(92%)')).toBeInTheDocument();
  });

  it('renders non-reusable icon when reusable is false', () => {
    render(<ReusabilityBadge reusable={false} verdict="Not Reusable" confidence={40} />);

    expect(screen.getByText('❌')).toBeInTheDocument();
  });
});
