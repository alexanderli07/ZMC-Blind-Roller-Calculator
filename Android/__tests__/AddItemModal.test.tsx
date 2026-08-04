import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import AddItemModal from '../src/components/AddItemModal';
import { validateFabricInput } from '../src/validation';

jest.mock('../src/theme/themeStorage', () => ({
  loadThemePreference: jest.fn(),
  saveThemePreference: jest.fn(),
}));

jest.mock('../src/theme/theme', () => {
  const actual = jest.requireActual('../src/theme/theme');
  return {
    ...actual,
    useTheme: () => ({
      preference: 'system',
      resolvedTheme: 'light',
      colors: actual.lightPalette,
      saveError: null,
      setPreference: jest.fn(),
      clearSaveError: jest.fn(),
    }),
  };
});

const fields = [{ key: 'name', label: 'Name', numeric: false }];
const fabricFields = [
  { key: 'name', label: 'Name', numeric: false },
  { key: 'weight', label: 'Weight (oz/yd²)', numeric: true },
  { key: 'thickness', label: 'Thickness (in)', numeric: true },
];

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

interface FiberWithPressHandler {
  memoizedProps?: { onPress?: () => Promise<void> };
  return: FiberWithPressHandler | null;
}

function getPressHandler(instance: TestInstance): () => Promise<void> {
  let fiber = instance.unstable_fiber as unknown as FiberWithPressHandler | null;
  while (fiber) {
    if (typeof fiber.memoizedProps?.onPress === 'function') {
      return fiber.memoizedProps.onPress;
    }
    fiber = fiber.return;
  }
  throw new Error('Press handler not found');
}

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

  test('does not cancel while a save is pending', async () => {
    const save = deferred();
    const onCancel = jest.fn();
    const onSubmit = jest.fn(() => save.promise);
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={onCancel}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={onSubmit}
      />
    );

    const pressConfirm = getPressHandler(screen.getByText('Confirm'));
    let pendingPress!: Promise<void>;
    await act(() => {
      pendingPress = pressConfirm();
    });
    await fireEvent.press(screen.getByText('Cancel'));

    await act(async () => {
      save.resolve();
      await pendingPress;
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('does not handle Android back while a save is pending', async () => {
    const save = deferred();
    const onCancel = jest.fn();
    const onSubmit = jest.fn(() => save.promise);
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={onCancel}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={onSubmit}
      />
    );

    const pressConfirm = getPressHandler(screen.getByText('Confirm'));
    let pendingPress!: Promise<void>;
    await act(() => {
      pendingPress = pressConfirm();
    });
    await act(() => {
      const modalHost = screen.container.queryAll(
        (instance) => instance.type === 'Modal'
      )[0];
      modalHost.props.onRequestClose();
    });

    await act(async () => {
      save.resolve();
      await pendingPress;
    });
    expect(onCancel).not.toHaveBeenCalled();
  });

  test('does not submit again after closing and reopening during a pending save', async () => {
    const save = deferred();
    const onSubmit = jest.fn(() => save.promise);
    const props = {
      title: 'Add Item',
      fields,
      onCancel: jest.fn(),
      validate: () => ({ ok: true as const, value: { name: 'Item' } }),
      onSubmit,
    };
    const screen = await render(<AddItemModal visible {...props} />);

    const pressConfirm = getPressHandler(screen.getByText('Confirm'));
    let pendingPress!: Promise<void>;
    await act(() => {
      pendingPress = pressConfirm();
    });
    await screen.rerender(<AddItemModal visible={false} {...props} />);
    await screen.rerender(<AddItemModal visible {...props} />);
    const pressReopenedConfirm = getPressHandler(screen.getByText('Confirm'));
    let secondPress!: Promise<void>;
    await act(() => {
      secondPress = pressReopenedConfirm();
    });

    await act(async () => {
      save.resolve();
      await pendingPress;
      await secondPress;
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('synchronously blocks rapid duplicate save calls', async () => {
    const save = deferred();
    const onSubmit = jest.fn(() => save.promise);
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
    const pressConfirm = getPressHandler(screen.getByText('Confirm'));

    let firstPress!: Promise<void>;
    let secondPress!: Promise<void>;
    await act(() => {
      firstPress = pressConfirm();
      secondPress = pressConfirm();
    });

    await act(async () => {
      save.resolve();
      await firstPress;
      await secondPress;
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test('uses the same synchronous guard for save and remove', async () => {
    const save = deferred();
    const onRemoveAll = jest.fn();
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={jest.fn()}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={() => save.promise}
        onRemoveAll={onRemoveAll}
      />
    );
    const pressConfirm = getPressHandler(screen.getByText('Confirm'));
    const pressRemove = getPressHandler(screen.getByText('Remove all user-defined items'));

    let savePress!: Promise<void>;
    let removePress!: Promise<void>;
    await act(() => {
      savePress = pressConfirm();
      removePress = pressRemove();
    });

    await act(async () => {
      save.resolve();
      await savePress;
      await removePress;
    });
    expect(onRemoveAll).not.toHaveBeenCalled();
  });

  test('allows cancellation while idle', async () => {
    const onCancel = jest.fn();
    const screen = await render(
      <AddItemModal
        visible
        title="Add Item"
        fields={fields}
        onCancel={onCancel}
        validate={() => ({ ok: true, value: { name: 'Item' } })}
        onSubmit={jest.fn()}
      />
    );

    await fireEvent.press(screen.getByText('Cancel'));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
