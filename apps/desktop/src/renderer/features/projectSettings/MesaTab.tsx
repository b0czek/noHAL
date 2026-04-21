import { useEditorStore } from "../../state/EditorStoreProvider";
import MesaConfigEditor from "./mesa/MesaConfigEditor";

export default function MesaTab() {
  const { state, actions } = useEditorStore();

  return (
    <MesaConfigEditor
      mesa={state.project.mesa ?? { hosts: [] }}
      onAddHost={actions.addMesaHost}
      onRemoveHost={actions.removeMesaHost}
      onUpdateHostKind={actions.updateMesaHostKind}
      onUpdateHostIp={actions.updateMesaHostIp}
      onSetConnectorCard={actions.setMesaConnectorCard}
      onSetSmartSerialProcessDataMode={
        actions.setMesaSmartSerialProcessDataMode
      }
      onSetRawGpioPinDirection={actions.setMesaRawGpioPinDirection}
      onSetSmartSerialCard={actions.setMesaSmartSerialCard}
      syncProject={state.project}
      onSync={actions.syncMesaManagedProjection}
    />
  );
}
