import { useStore, useRoute } from './store.js';
import { Nav, ToastProvider, AppProvider } from './components/ui.jsx';
import CheckScreen from './screens/CheckScreen.jsx';
import ResultScreen from './screens/ResultScreen.jsx';
import ProductScreen from './screens/ProductScreen.jsx';
import MeScreen from './screens/MeScreen.jsx';
import LogScreen from './screens/LogScreen.jsx';
import CabinetScreen from './screens/CabinetScreen.jsx';
import CheckMedScreen from './screens/CheckMedScreen.jsx';
import AddScreen from './screens/AddScreen.jsx';
import HealthScreen from './screens/HealthScreen.jsx';
import FamilyScreen from './screens/FamilyScreen.jsx';
import HelpScreen from './screens/HelpScreen.jsx';
import PlansScreen from './screens/PlansScreen.jsx';
import ExploreScreen from './screens/ExploreScreen.jsx';

const SCREENS = {
  check: CheckScreen,
  result: ResultScreen,
  product: ProductScreen,
  me: MeScreen,
  log: LogScreen,
  cabinet: CabinetScreen,
  checkmed: CheckMedScreen,
  add: AddScreen,
  health: HealthScreen,
  family: FamilyScreen,
  help: HelpScreen,
  plans: PlansScreen,
  explore: ExploreScreen,
};

export default function App() {
  const [state, dispatch] = useStore();
  const [route, go, back] = useRoute();
  const Screen = SCREENS[route.name] || CheckScreen;
  return (
    <AppProvider value={{ state, dispatch, go, back }}>
      <ToastProvider>
        <div className="app">
          <div className="screen" key={route.name + '/' + (route.param || '')}>
            <Screen state={state} dispatch={dispatch} go={go} param={route.param} />
          </div>
          <Nav route={route.name} />
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
