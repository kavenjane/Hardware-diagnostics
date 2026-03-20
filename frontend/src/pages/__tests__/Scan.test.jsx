import { render, screen } from '@testing-library/react';
import Scan from '../Scan';

describe('Scan page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders scanning workflow labels', () => {
    render(<Scan />);

    expect(screen.getByText('PWA SCANNING')).toBeInTheDocument();
    expect(screen.getByText('1) CAPTURE OR UPLOAD IMAGE')).toBeInTheDocument();
    expect(screen.getByText('2) EXTRACTED TEXT')).toBeInTheDocument();
    expect(screen.getByText('3) FIX / INSTALLATION GUIDANCE')).toBeInTheDocument();
  });

  it('keeps OCR action disabled until a file is selected', () => {
    render(<Scan />);

    expect(screen.getByText('Extract Text (OCR)')).toBeDisabled();
  });
});
