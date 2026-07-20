import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RepeatableSection } from './RepeatableSection';

function RepeatableSectionHarness() {
  const [items, setItems] = useState([{ id: 'career-one', label: '첫 번째 경력' }]);

  return (
    <RepeatableSection
      columns={[{ key: 'career', label: '경력 내용' }]}
      items={items}
      title="경력"
      onAdd={() => setItems((currentItems) => [
        ...currentItems,
        { id: 'career-two', label: '두 번째 경력' },
      ])}
      onRemove={(id) => setItems((currentItems) => currentItems.filter((item) => item.id !== id))}
      renderItem={(item) => <td><p>{item.label}</p></td>}
    />
  );
}

describe('RepeatableSection', () => {
  it('항목을 추가하고 원하는 항목을 삭제할 수 있다', async () => {
    const user = userEvent.setup();
    render(<RepeatableSectionHarness />);

    await user.click(screen.getByRole('button', { name: '경력 추가' }));

    const secondCareer = screen.getByRole('row', { name: '경력 2' });
    expect(within(secondCareer).getByText('두 번째 경력')).toBeInTheDocument();

    await user.click(within(secondCareer).getByRole('button', { name: '경력 항목 삭제' }));

    expect(screen.queryByRole('row', { name: '경력 2' })).not.toBeInTheDocument();
    expect(screen.getByRole('row', { name: '경력 1' })).toBeInTheDocument();
  });
});
