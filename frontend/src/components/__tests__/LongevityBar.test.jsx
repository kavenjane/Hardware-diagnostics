import { render, screen } from '@testing-library/react';
import LongevityBar from '../LongevityBar';

describe('LongevityBar', () => {
  const longevity = {
    estimatedYears: 3,
    riskLevel: 'MEDIUM',
    degradationRate: 'Moderate wear over time'
  };

  it('renders longevity summary details', () => {
    render(<LongevityBar longevity={longevity} componentName="Battery" />);

    expect(screen.getByText('ESTIMATED LIFESPAN')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('Moderate wear over time')).toBeInTheDocument();
    expect(screen.getByText('Battery lifespan projection (max 6 years)')).toBeInTheDocument();
  });

  it('sets bar width based on estimated years', () => {
    const { container } = render(<LongevityBar longevity={longevity} componentName="Battery" />);

    const fill = container.querySelector('.longevity-bar-fill');
    expect(fill).toHaveStyle({ width: '50%' });
  });
});
