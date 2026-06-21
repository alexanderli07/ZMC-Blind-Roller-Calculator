import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AddItemModal from '../src/components/AddItemModal';
import { validateFabricInput } from '../src/validation';

const fields = [{ key: 'name', label: 'Name', numeric: false }];
const fabricFields = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'weight', label: 'Weight (oz/yd²)', numeric: true },
  { key: 'thickness', label: 'Thickness (in)', numeric: true },
];

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

  test('shows an inline error for an empty fabric submission', async () => {
    const onSubmit = jest.fn();
    const screen = await render(
      <AddItemModal
        visible
        title="Add Fabric Type"
        fields={fabricFields}
        onCancel={jest.fn()}
        validate={(values) => validateFabricInput(values, [])}
        onSubmit={onSubmit}
      />
    );

    await fireEvent.press(screen.getByText('Confirm'));

    expect(screen.getByText('Name is required.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('shows an inline error for a partially filled fabric submission', async () => {
    const onSubmit = jest.fn();
    const screen = await render(
      <AddItemModal
        visible
        title="Add Fabric Type"
        fields={fabricFields}
        onCancel={jest.fn()}
        validate={(values) => validateFabricInput(values, [])}
        onSubmit={onSubmit}
      />
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Fabric');
    await fireEvent.press(screen.getByText('Confirm'));

    expect(screen.getByText('Weight must be a number greater than 0.')).toBeTruthy();
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

  test('does not submit again while a save is pending', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = jest.fn(
      () => new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      })
    );
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={onSubmit}
      />
    );

    await fireEvent.changeText(screen.getByPlaceholderText('Name'), 'Item');
    const firstPress = fireEvent.press(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    await fireEvent.press(screen.getByText('Confirm'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    resolveSubmit();
    await firstPress;
  });
});
