import ClientComplaintsPanel from '../components/widgets/client-complaints-panel';

// Recepcionista's view of "Clientas" -- just the Quejas panel, reusing the
// same widget the full Clients page uses for its "quejas" tab. Deliberately
// not the full Clients page: that page fires several other useApi calls
// unconditionally on mount (directorio, retención, CLV...) regardless of
// which tab is active, none of which are in the recepcionista's backend
// allowlist (app/main.py in zenya-api) -- rendering it here would 403 on load.
const ClientComplaintsOnly = ({ dateRange }) => (
  <ClientComplaintsPanel dateRange={dateRange} onChangeFlagged={() => {}} />
);

export default ClientComplaintsOnly;
