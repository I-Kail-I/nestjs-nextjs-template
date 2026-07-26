import { render, screen } from '@testing-library/react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';
import '@testing-library/jest-dom';

describe('Card', () => {
  it('renders with default props', () => {
    render(<Card>Card Content</Card>);
    const card = screen.getByText('Card Content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('data-slot', 'card');
    expect(card).toHaveAttribute('data-size', 'default');
  });

  it('renders with sm size', () => {
    render(<Card size="sm">Small Card</Card>);
    const card = screen.getByText('Small Card');
    expect(card).toHaveAttribute('data-size', 'sm');
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Card</Card>);
    const card = screen.getByText('Card');
    expect(card).toHaveClass('custom-class');
  });

  it('renders with default classes', () => {
    render(<Card>Card</Card>);
    const card = screen.getByText('Card');
    expect(card).toHaveClass('group/card');
    expect(card).toHaveClass('bg-card');
    expect(card).toHaveClass('rounded-xl');
  });

  it('passes additional HTML attributes', () => {
    render(<Card id="test-card">Card</Card>);
    const card = screen.getByText('Card');
    expect(card).toHaveAttribute('id', 'test-card');
  });
});

describe('CardHeader', () => {
  it('renders correctly', () => {
    render(<CardHeader>Header Content</CardHeader>);
    const header = screen.getByText('Header Content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('data-slot', 'card-header');
  });

  it('applies custom className', () => {
    render(<CardHeader className="custom-header">Header</CardHeader>);
    const header = screen.getByText('Header');
    expect(header).toHaveClass('custom-header');
  });

  it('has default styling classes', () => {
    render(<CardHeader>Header</CardHeader>);
    const header = screen.getByText('Header');
    expect(header).toHaveClass('group/card-header');
    expect(header).toHaveClass('rounded-t-xl');
  });
});

describe('CardTitle', () => {
  it('renders correctly', () => {
    render(<CardTitle>Card Title</CardTitle>);
    const title = screen.getByText('Card Title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute('data-slot', 'card-title');
  });

  it('applies custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-title');
  });

  it('has font styling classes', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title).toHaveClass('font-heading');
    expect(title).toHaveClass('font-medium');
  });
});

describe('CardDescription', () => {
  it('renders correctly', () => {
    render(<CardDescription>Description text</CardDescription>);
    const desc = screen.getByText('Description text');
    expect(desc).toBeInTheDocument();
    expect(desc).toHaveAttribute('data-slot', 'card-description');
  });

  it('has muted foreground styling', () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen.getByText('Description');
    expect(desc).toHaveClass('text-muted-foreground');
  });
});

describe('CardAction', () => {
  it('renders correctly', () => {
    render(<CardAction>Action Button</CardAction>);
    const action = screen.getByText('Action Button');
    expect(action).toBeInTheDocument();
    expect(action).toHaveAttribute('data-slot', 'card-action');
  });

  it('has positioning classes', () => {
    render(<CardAction>Action</CardAction>);
    const action = screen.getByText('Action');
    expect(action).toHaveClass('col-start-2');
    expect(action).toHaveClass('justify-self-end');
  });
});

describe('CardContent', () => {
  it('renders correctly', () => {
    render(<CardContent>Main content</CardContent>);
    const content = screen.getByText('Main content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute('data-slot', 'card-content');
  });

  it('renders children correctly', () => {
    render(
      <CardContent>
        <p>Paragraph 1</p>
        <p>Paragraph 2</p>
      </CardContent>,
    );
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders correctly', () => {
    render(<CardFooter>Footer content</CardFooter>);
    const footer = screen.getByText('Footer content');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveAttribute('data-slot', 'card-footer');
  });

  it('has flex layout', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });
});

describe('Card Integration', () => {
  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
          <CardAction>
            <button>Action</button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p>Main content here</p>
        </CardContent>
        <CardFooter>
          <button>Footer Action</button>
        </CardFooter>
      </Card>,
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Footer Action')).toBeInTheDocument();
  });

  it('renders card with sm size and proper title styling', () => {
    render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>Small Card Title</CardTitle>
        </CardHeader>
      </Card>,
    );

    const card = screen.getByText('Small Card Title').closest('[data-slot="card"]');
    expect(card).toHaveAttribute('data-size', 'sm');
  });

  it('handles multiple cards independently', () => {
    render(
      <>
        <Card data-testid="card-1">
          <CardHeader>
            <CardTitle>Card 1</CardTitle>
          </CardHeader>
        </Card>
        <Card data-testid="card-2" size="sm">
          <CardHeader>
            <CardTitle>Card 2</CardTitle>
          </CardHeader>
        </Card>
      </>,
    );

    const card1 = screen.getByTestId('card-1');
    const card2 = screen.getByTestId('card-2');

    expect(card1).toHaveAttribute('data-size', 'default');
    expect(card2).toHaveAttribute('data-size', 'sm');
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  it('renders card with image', () => {
    render(
      <Card>
        <img src="test.jpg" alt="test" />
        <CardContent>Content</CardContent>
      </Card>,
    );

    expect(screen.getByAltText('test')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
