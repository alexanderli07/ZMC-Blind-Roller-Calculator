import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AddItemModal from '../src/components/AddItemModal';

const fields = [{ key: 'name', label: 'Name', numeric: false }];

describe('<AddItemModal />', () => {
  test('shows a validation error without submitting', async () => {
    const onSubmit = jest.fn();
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: false, error: 'Invalid item.' })}
        onSubmit={onSubmit}
      />
    );
    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Bad');
    await fireEvent.press(screen.getByText('Confirm'));
    expect(screen.getByText('Invalid item.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('keeps the modal open and shows a save failure', async () => {
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={jest.fn().mockRejectedValue(new Error('storage failed'))}
      />
    );
    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Item');
    await fireEvent.press(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(screen.getByText('Could not save the item. Please try again.')).toBeTruthy();
    });
  });

  test('shows a remove failure', async () => {
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={jest.fn()}
        onRemoveAll={jest.fn().mockRejectedValue(new Error('storage failed'))}
      />
    );
    await fireEvent.press(screen.getByText('Remove all user-defined items'));
    await waitFor(() => {
      expect(screen.getByText('Could not remove the items. Please try again.')).toBeTruthy();
    });
  });
});
