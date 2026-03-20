import { render, screen } from '@testing-library/react';
import ScoreRing from '../ScoreRing';

describe('ScoreRing', () => {
  it('renders score and health labels', () => {
    const { container } = render(<ScoreRing score={75} health="GOOD" size={120} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('GOOD')).toBeInTheDocument();

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(2);
    expect(circles[1].getAttribute('stroke')).toBe('#10B981');
  });

  it('uses neutral color for unknown health status', () => {
    const { container } = render(<ScoreRing score={50} health="UNKNOWN" />);

    const circles = container.querySelectorAll('circle');
    expect(circles[1].getAttribute('stroke')).toBe('#9AA4B2');
  });
});
