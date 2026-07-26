import { render, screen } from '@testing-library/react';
import { Spinner } from './spinner';
import '@testing-library/jest-dom';

describe('Spinner', () => {
  it('renders an svg element', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner.tagName).toBe('svg');
  });

  it('has the correct data-slot attribute', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('data-slot', 'spinner');
  });

  it('has role status for accessibility', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('applies default classes', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('size-4');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('applies custom className', () => {
    render(<Spinner className="text-primary size-8" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('text-primary');
    expect(spinner).toHaveClass('size-8');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('passes additional HTML attributes', () => {
    render(<Spinner id="test-spinner" data-testid="spinner" />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toHaveAttribute('id', 'test-spinner');
  });

  it('combines custom and default classes', () => {
    render(<Spinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
    expect(spinner).toHaveClass('size-4');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders with custom aria-label', () => {
    render(<Spinner aria-label="Processing..." />);
    const spinner = screen.getByLabelText('Processing...');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Processing...');
  });

  it('renders with custom styles', () => {
    render(<Spinner style={{ color: 'red', width: '32px' }} />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle({ color: 'rgb(255, 0, 0)', width: '32px' });
  });

  it('renders multiple spinners independently', () => {
    render(
      <>
        <Spinner data-testid="spinner-1" className="text-blue-500" />
        <Spinner data-testid="spinner-2" className="text-red-500" />
      </>,
    );

    const spinner1 = screen.getByTestId('spinner-1');
    const spinner2 = screen.getByTestId('spinner-2');

    expect(spinner1).toBeInTheDocument();
    expect(spinner2).toBeInTheDocument();
    expect(spinner1).toHaveClass('text-blue-500');
    expect(spinner2).toHaveClass('text-red-500');
  });

  it('has the correct Lucide icon properties', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    expect(spinner).toHaveAttribute('width', '24');
    expect(spinner).toHaveAttribute('height', '24');
    expect(spinner).toHaveAttribute('viewBox', '0 0 24 24');
    expect(spinner).toHaveAttribute('fill', 'none');
    expect(spinner).toHaveAttribute('stroke', 'currentColor');
    expect(spinner).toHaveAttribute('stroke-width', '2');
  });
});
