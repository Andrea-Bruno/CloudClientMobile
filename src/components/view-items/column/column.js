import { View, Text, TouchableOpacity, Pressable } from 'react-native'
import { ColumnStyles } from '../styles'
import DotsIcon from '../../../assets/icons/viewer/dotsvertical.svg';
import StarIcon from '../../../assets/icons/viewer/star2.svg';
import DownloadIcon from '../../../assets/icons/viewer/download.svg';
import { renderThumbnail } from '../renderThumbnail';
import { useContextApi } from '../../../context/ContextApi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { removeSelectedFiles, setFound, setLocation, setSelectedFile, setSelectedFiles } from '../../../reducers/fileReducer';
import { navigateToFolder } from '../../../utils/essential-functions';
import { AntDesign } from '@expo/vector-icons';
import { fileExistsCheck } from '../../../utils/local-files';
import { useCallback } from 'react';
import { enqueue } from '../../../reducers/refreshQueueReducer';
import { downloadManager, openFileNatively, titleShortener } from '../functions';


export const Column = ({ item, contentSetter }) => {

    const { bottomSheetController } = useContextApi();
    const { selectedFiles, favorites, found } = useSelector(state => state.files);
    const { downloadQueue } = useSelector(state => state.newFileTransfer)
    const networkInformation = useSelector(state => state.network);
    const dispatch = useDispatch();
    const { name } = useRoute();
    const { navigate } = useNavigation();


    const settingOnPress = (file) => {
        bottomSheetController(2, name);
        dispatch(setSelectedFile({ ...file, screen: name, isFavorite: favorites?.includes(file.path) }))
        dispatch(setFound(null))
    }

    const onLongPressHandler = (file) => {
        dispatch(setFound(null))
        if (selectedFiles.includes(file)) dispatch(removeSelectedFiles(file));
        else return dispatch(setSelectedFiles(file))
    }


    const multiSelectCheck = (file) => {
        if (selectedFiles.length) {
            if (selectedFiles.includes(file)) {
                dispatch(removeSelectedFiles(file));
            }
            else {
                dispatch(setSelectedFiles(file))
            }

            return true;
        }
        else return false;
    }

    const folderPress = async (folder) => {

        if (multiSelectCheck(folder) === true) {
            return;
        }

        if (name !== 'FavoriteScreen') {
            navigateToFolder(folder.title, 'CloudScreen').then(content => contentSetter(content));
            return
        }
        dispatch(enqueue('CloudScreen'))
        dispatch(setLocation(folder.path))
        navigate('CloudScreen');
    }

    const filePress = async (file) => {
        if (multiSelectCheck(file) === true) return;
        const { uri, mime, source } = await fileExistsCheck(file);
        if (uri || source) {
            return openFileNatively(uri, mime, source);
        }
        downloadManager(dispatch, name, file, downloadQueue, networkInformation);
    }


    const onPressHandler = async (type, item) => {
        dispatch(setFound(null))
        switch (type) {
            case "folder":
                folderPress(item);
                break;
            default:
                filePress(item);
                break;
        }
    }

    const checkIsFav = useCallback((path) => {
        return favorites?.includes(path) ? <StarIcon style={ColumnStyles.overlayStar} /> : null
    }, [favorites])


    return (
        <TouchableOpacity
            onPress={() => onPressHandler(item.type, item)}
            onLongPress={() => onLongPressHandler(item)}
            style={[item.type === 'folder' ? { ...ColumnStyles.container, borderColor: "#00000043" } : ColumnStyles.container, item.name === found && { borderColor: '#5D82F5' }, selectedFiles.includes(item) && { borderColor: '#1a4feb' }]}>
            {checkIsFav(item.path)}
            {downloadQueue.includes(item.name) && <DownloadIcon style={ColumnStyles.overlayDownload} />}
            <View style={ColumnStyles.left}>
                {selectedFiles.includes(item) && <AntDesign name="checkcircleo" size={20} color="#5D82F5" style={ColumnStyles.overlay} />}

                <View style={ColumnStyles.thumbnail}>{renderThumbnail(item, 5)}</View>
                <View style={ColumnStyles.textArea}>
                    <Text style={ColumnStyles.title} numberOfLines={1}>{titleShortener(item.path, name)}</Text>
                    <Text style={ColumnStyles.description}>{item.description}</Text>
                </View>
            </View>
            {
                selectedFiles.length == 0 &&
                <Pressable hitSlop={18} onPress={() => settingOnPress(item)} style={ColumnStyles.setting}>
                    <DotsIcon />
                </Pressable>
            }
        </TouchableOpacity >
    )
}
