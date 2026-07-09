import { render, screen } from '@testing-library/react';
import { Skeleton } from './skeleton';
import '@testing-library/jest-dom';

describe('Skeleton', () => {
  it('renders a div element', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton.tagName).toBe('DIV');
  });

  it('has the correct data-slot attribute', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('data-slot', 'skeleton');
  });

  it('applies default classes', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('bg-muted');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    render(<Skeleton data-testid="skeleton" className="h-10 w-full" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('h-10');
    expect(skeleton).toHaveClass('w-full');
    expect(skeleton).toHaveClass('bg-muted'); // still has default classes
  });

  it('passes additional HTML attributes', () => {
    render(<Skeleton data-testid="skeleton" id="test-skeleton" aria-hidden="true" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('id', 'test-skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders with custom styles', () => {
    render(<Skeleton data-testid="skeleton" style={{ width: '200px', height: '50px' }} />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('renders children content', () => {
    render(<Skeleton data-testid="skeleton">Loading...</Skeleton>);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveTextContent('Loading...');
  });

  it('combines custom and default classes', () => {
    render(<Skeleton data-testid="skeleton" className="custom-class" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-class');
    expect(skeleton).toHaveClass('animate-pulse');
    expect(skeleton).toHaveClass('rounded-md');
    expect(skeleton).toHaveClass('bg-muted');
  });

  it('renders multiple skeletons independently', () => {
    render(
      <>
        <Skeleton data-testid="skeleton-1" className="h-4 w-3/4" />
        <Skeleton data-testid="skeleton-2" className="h-8 w-full" />
      </>,
    );

    const skeleton1 = screen.getByTestId('skeleton-1');
    const skeleton2 = screen.getByTestId('skeleton-2');

    expect(skeleton1).toBeInTheDocument();
    expect(skeleton2).toBeInTheDocument();
    expect(skeleton1).toHaveClass('h-4');
    expect(skeleton2).toHaveClass('h-8');
  });

  it('handles role attribute for accessibility', () => {
    render(<Skeleton data-testid="skeleton" role="status" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
  });

  it('renders as an empty div by default', () => {
    render(<Skeleton data-testid="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeEmptyDOMElement();
  });
});
