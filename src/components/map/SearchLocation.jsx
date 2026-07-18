import React from 'react';
import { Navigation, Search } from 'lucide-react';

const SearchLocation = ({
  query,
  onQueryChange,
  onSearch,
  onUseMyLocation,
  isSearching,
  isLocating,
  error,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Location Search</h3>
      <form onSubmit={onSearch} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Enter address or coordinates..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition-all hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSearching ? 'Searching...' : 'Search Location'}
        </button>
      </form>

      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={isLocating}
        className="flex w-full items-center justify-center space-x-2 rounded-xl bg-slate-100 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Navigation size={18} />
        <span>{isLocating ? 'Detecting...' : 'My Location'}</span>
      </button>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchLocation;
