/**
 * NotificationCenter Component Tests
 *
 * Tests for the notification center modal component with filtering,
 * mark as read, and delete functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationCenter } from '../components/ui/NotificationCenter';
import { toast } from 'sonner';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NotificationCenter', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders notification count badge with unread count', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Should show badge with count 3 (3 unread notifications in mock data)
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('3 unread')).toBeInTheDocument();
  });

  it('shows all notifications in list by default', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Check that all notification titles are visible
    expect(screen.getByText('Safety Alert')).toBeInTheDocument();
    expect(screen.getByText('Budget Variance')).toBeInTheDocument();
    expect(screen.getByText('Inspection Passed')).toBeInTheDocument();
    expect(screen.getByText('New Document')).toBeInTheDocument();
  });

  it('filters by unread status', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    const filterSelect = screen.getByLabelText('Filter by read status') as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: 'unread' } });

    await waitFor(() => {
      // Should only show unread notifications
      expect(screen.getByText('Safety Alert')).toBeInTheDocument();
      expect(screen.getByText('Budget Variance')).toBeInTheDocument();
      expect(screen.getByText('New Document')).toBeInTheDocument();
      // Read notification should not be visible
      expect(screen.queryByText('Inspection Passed')).not.toBeInTheDocument();
    });
  });

  it('filters by read status', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    const filterSelect = screen.getByLabelText('Filter by read status') as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: 'read' } });

    await waitFor(() => {
      // Should only show read notifications
      expect(screen.getByText('Inspection Passed')).toBeInTheDocument();
      // Unread notifications should not be visible
      expect(screen.queryByText('Safety Alert')).not.toBeInTheDocument();
    });
  });

  it('filters by notification type', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    const typeSelect = screen.getByLabelText('Filter by notification type') as HTMLSelectElement;
    fireEvent.change(typeSelect, { target: { value: 'alert' } });

    await waitFor(() => {
      // Should only show alert notifications
      expect(screen.getByText('Safety Alert')).toBeInTheDocument();
      expect(screen.queryByText('Budget Variance')).not.toBeInTheDocument();
    });
  });

  it('marks single notification as read', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Find all "Mark as read" buttons and click the first one
    const markReadButtons = screen.getAllByLabelText('Mark as read');
    fireEvent.click(markReadButtons[0]);

    expect(toast.success).toHaveBeenCalledWith('Marked as read');
    // Badge count should decrease
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('2 unread')).toBeInTheDocument();
    });
  });

  it('marks all notifications as read', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Click mark all as read button - has CheckCheck icon
    const markAllReadButton = screen.getByLabelText('Mark all notifications as read');
    fireEvent.click(markAllReadButton);

    expect(toast.success).toHaveBeenCalledWith('All notifications marked as read');
    // Badge should show 0
    await waitFor(() => {
      expect(screen.getByText('0 unread')).toBeInTheDocument();
    });
  });

  it('deletes a notification', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Click delete button - circular button with X icon
    const deleteButtons = screen.getAllByLabelText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(toast.success).toHaveBeenCalledWith('Notification deleted');
    // Should have one less notification
    await waitFor(() => {
      expect(screen.queryByText('Safety Alert')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when clicking close button', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Click close button
    const closeButton = screen.getByLabelText('Close notification center');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking outside modal', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Click on overlay (outside modal content)
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays notification action button with correct link', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    // Check action button exists for notification with actionUrl
    const viewButton = screen.getByText('View Alert');
    expect(viewButton).toBeInTheDocument();
    expect(viewButton.closest('a')).toHaveAttribute('href', '/safety/alerts/1');
  });

  it('displays notification count in footer', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    expect(screen.getByText('4 notifications displayed')).toBeInTheDocument();
  });

  it('updates footer count when filtering', async () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    const filterSelect = screen.getByLabelText('Filter by read status') as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: 'unread' } });

    await waitFor(() => {
      expect(screen.getByText('3 notifications displayed')).toBeInTheDocument();
    });
  });

  it('has settings button', () => {
    render(<NotificationCenter onClose={mockOnClose} />);

    expect(screen.getByLabelText('Notification settings')).toBeInTheDocument();
  });
});
