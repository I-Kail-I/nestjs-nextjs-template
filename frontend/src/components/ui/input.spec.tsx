import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';
import '@testing-library/jest-dom';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('has the correct data-slot attribute', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-slot', 'input');
  });

  it('applies default classes', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-input');
    expect(input).toHaveClass('h-9');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-md');
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('sets the type attribute', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders as password input when type is password', () => {
    render(<Input type="password" />);
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('passes additional HTML attributes', () => {
    render(<Input placeholder="Enter text" id="test-input" name="test-name" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toHaveAttribute('id', 'test-input');
    expect(input).toHaveAttribute('name', 'test-name');
  });

  it('handles user input correctly', async () => {
    const user = userEvent.setup();
    render(<Input />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:pointer-events-none');
    expect(input).toHaveClass('disabled:cursor-not-allowed');
  });

  it('handles required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('handles readonly attribute', () => {
    render(<Input readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('renders with a default value', () => {
    render(<Input defaultValue="Default text" />);
    const input = screen.getByDisplayValue('Default text');
    expect(input).toBeInTheDocument();
  });

  it('renders with a controlled value', () => {
    render(<Input value="Controlled text" readOnly />);
    const input = screen.getByDisplayValue('Controlled text');
    expect(input).toBeInTheDocument();
  });

  it('applies aria attributes correctly', () => {
    render(<Input aria-label="test label" aria-invalid={true} />);
    const input = screen.getByLabelText('test label');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('aria-invalid:border-destructive');
  });

  it('handles onChange callback', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'a');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles onFocus and onBlur callbacks', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    const user = userEvent.setup();

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');

    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('renders with number type', () => {
    render(<Input type="number" min={0} max={100} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('applies file input classes when type is file', () => {
    render(<Input type="file" />);
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveClass('file:text-foreground');
    expect(input).toHaveClass('file:inline-flex');
  });
});
