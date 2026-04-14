import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountryCombobox } from '@/components/shared/country-combobox';

describe('CountryCombobox', () => {
  it('renders with placeholder when no value is selected', () => {
    const onValueChange = vi.fn();
    render(
      <CountryCombobox
        id="country-select"
        placeholder="Select a country"
        value=""
        onValueChange={onValueChange}
      />
    );
    
    // The underlying button/trigger should show the placeholder
    expect(screen.getByRole('combobox')).toHaveTextContent('Select a country');
  });

  it('renders the selected country label when value is provided', () => {
    const onValueChange = vi.fn();
    render(
      <CountryCombobox
        id="country-select"
        placeholder="Select a country"
        value="US"
        onValueChange={onValueChange}
      />
    );
    
    // United States should be rendered
    expect(screen.getByRole('combobox')).toHaveTextContent('United States');
  });

  it('can open and search for a country', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    
    render(
      <CountryCombobox
        id="country-select"
        placeholder="Select a country"
        value=""
        onValueChange={onValueChange}
      />
    );
    
    // Click the combobox trigger to open it
    await user.click(screen.getByRole('combobox'));
    
    // The search input should be visible
    const searchInput = screen.getByPlaceholderText('Search country');
    expect(searchInput).toBeInTheDocument();
    
    // Type in the search
    await user.type(searchInput, 'United Kingdom');
    
    // Click the option
    const option = await screen.findByRole('option', { name: /United Kingdom/i });
    expect(option).toBeInTheDocument();
    
    await user.click(option);
    
    // Ensure the callback was called with the right country code (GB)
    expect(onValueChange).toHaveBeenCalledWith('GB');
  });
});
