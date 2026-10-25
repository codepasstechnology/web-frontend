/** Detail requests stay separate from the much smaller visible-area feed. */
export function ListingLoadStatus({
  query,
  onClose,
}: {
  query: { isPending: boolean; isError: boolean; refetch: () => unknown };
  onClose: () => void;
}) {
  if (!query.isPending && !query.isError) return null;
  return (
    <div className="gm-err" role={query.isError ? "alert" : "status"}>
      {query.isError ? "Couldn't load listing details." : "Loading listing details…"}
      {query.isError && (
        <button type="button" onClick={() => query.refetch()}>
          Retry
        </button>
      )}
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
