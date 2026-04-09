"use client";

import { useMemo } from "react";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  businessCountryOptions,
  getBusinessCountryOption,
} from "@/features/businesses/locale";

type CountryComboboxProps = {
  autoFocus?: boolean;
  disabled?: boolean;
  id: string;
  onValueChange: (countryCode: string) => void;
  placeholder: string;
  searchPlaceholder?: string;
  value: string;
  "aria-invalid"?: boolean;
};

type CountryComboboxOption = ComboboxOption & {
  countryCode: string;
  currencyCode: string;
  flag: string;
};

export function CountryCombobox({
  autoFocus = false,
  disabled = false,
  id,
  onValueChange,
  placeholder,
  searchPlaceholder = "Search country",
  value,
  "aria-invalid": ariaInvalid,
}: CountryComboboxProps) {
  const selectedCountry = useMemo(
    () => getBusinessCountryOption(value),
    [value],
  );
  const options = useMemo<CountryComboboxOption[]>(
    () =>
      businessCountryOptions.map((countryOption) => ({
        countryCode: countryOption.code,
        currencyCode: countryOption.currencyCode,
        flag: countryOption.flag,
        label: countryOption.label,
        searchText: `${countryOption.label} ${countryOption.code} ${countryOption.currencyCode}`,
        value: countryOption.code,
      })),
    [],
  );

  return (
    <Combobox
      aria-invalid={ariaInvalid}
      autoFocus={autoFocus}
      disabled={disabled}
      emptyMessage="No countries found."
      groupHeading="Countries"
      id={id}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      renderOption={(option) => (
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="shrink-0 text-base leading-none">
            {option.flag}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{option.label}</p>
            <p className="text-xs text-muted-foreground">
              {option.countryCode} - {option.currencyCode}
            </p>
          </div>
        </div>
      )}
      renderValue={() =>
        selectedCountry ? (
          <span className="flex min-w-0 items-center gap-2 text-left">
            <span aria-hidden="true" className="shrink-0 text-base leading-none">
              {selectedCountry.flag}
            </span>
            <span className="truncate">{selectedCountry.label}</span>
          </span>
        ) : null
      }
      searchable
      searchPlaceholder={searchPlaceholder}
      value={value}
    />
  );
}
