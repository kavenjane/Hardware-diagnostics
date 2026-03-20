import { render, screen } from '@testing-library/react';
import ComponentCard from '../ComponentCard';

describe('ComponentCard module coverage', () => {
  it.each(['keyboard', 'gpu', 'bluetooth', 'wifi', 'sound'])(
    'renders module card for %s',
    (moduleName) => {
      render(<ComponentCard name={moduleName} data={{ health: 'GOOD', score: 88 }} />);

      expect(screen.getByText(moduleName.toUpperCase())).toBeInTheDocument();
      expect(screen.getByText('GOOD')).toBeInTheDocument();
      expect(screen.getByText('Score: 88')).toBeInTheDocument();
    }
  );

  it('shows data unavailable state for keyboard module when data is missing', () => {
    render(<ComponentCard name="keyboard" data={null} />);

    expect(screen.getByText('keyboard: Data unavailable')).toBeInTheDocument();
  });
});
