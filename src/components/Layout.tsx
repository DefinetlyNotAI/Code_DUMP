import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <main className="min-h-screen flex flex-col">
      <Outlet />
    </main>
  );
};

export default Layout;