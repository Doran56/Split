import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DATABASE_NAME } from './src/db/client';
import { initDb } from './src/db/schema';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useBudgetStore } from './src/store/useBudgetStore';

function Hydrator({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const hydrate = useBudgetStore((state) => state.hydrate);

  useEffect(() => {
    hydrate(db);
  }, [db, hydrate]);

  return <>{children}</>;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDb}>
        <Hydrator>
          <RootNavigator />
        </Hydrator>
      </SQLiteProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
