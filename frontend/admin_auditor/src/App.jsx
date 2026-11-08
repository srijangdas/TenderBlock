import { AuthProvider,useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import OperationsWorkspacePage from './pages/OperationsWorkspacePage';

function OperationsPortal(){const {user}=useAuth();return user?<OperationsWorkspacePage/>:<LoginPage/>}
export default function App(){return <ThemeProvider><AuthProvider><OperationsPortal/></AuthProvider></ThemeProvider>}
