import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { setBottomCommandId } from "../reducers/bottomSheetReducer";
import { ModalBox } from "../components/modal";

const ContextApi = createContext({});
export const useContextApi = () => useContext(ContextApi);
export const ContextApiProvider = ({ children }) => {
    const bottomSheetRef = useRef(null);
    const [wsScreen, setWsScreen] = useState(false);
    const dispatch = useDispatch()
    const closeBottomSheet = () => bottomSheetRef.current.close();

    const bottomSheetController = useCallback((command = 1, name) => {
        dispatch(setBottomCommandId({ command: command === -1 ? 1 : command, screenName: name }));
        bottomSheetRef.current.snapToIndex(command);
    }, [])

    return (
        <ContextApi.Provider value={{ closeBottomSheet, bottomSheetRef, bottomSheetController, wsScreen, setWsScreen }}>
            {children}
            <ModalBox />
        </ContextApi.Provider>
    );
};