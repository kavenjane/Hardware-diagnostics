import { render, screen } from '@testing-library/react';
import CategoryBadge from '../CategoryBadge';

describe('CategoryBadge', () => {
  it('renders category, score and computed percentage', () => {
    render(
      <CategoryBadge
        category="Performance"
        score={45}
        maxScore={60}
        details={{ boot_time: 'Fast', nested_data: { cpu: 'Stable', gpu: 'Cool' } }}
      />
    );

    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('/ 60')).toBeInTheDocument();
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
    expect(screen.getByText('BOOT TIME')).toBeInTheDocument();
    expect(screen.getByText('Fast')).toBeInTheDocument();
    expect(screen.getByText('NESTED DATA')).toBeInTheDocument();
    expect(screen.getByText('cpu: Stable | gpu: Cool')).toBeInTheDocument();
  });
});
