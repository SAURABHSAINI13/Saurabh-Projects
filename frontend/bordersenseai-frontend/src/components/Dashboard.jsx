import AlertList from './AlertList.jsx';

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>BorderSenseAI Dashboard</h1>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 2, border: '1px solid #ccc', padding: 10 }}>
          <AlertList />
        </div>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 10 }}>
          <h3>Quick Actions</h3>
          <button>Optimize Patrol</button>
          <button>View Assets</button>
        </div>
      </div>
    </div>
  );
}
