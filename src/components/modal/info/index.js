import { View, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { closeModal } from '../../../reducers/modalReducer'
import { Button } from '../../button'
import { iconManager } from '../iconManager'
import { styles } from './styles'

const InfoTypeModal = () => {
    const dispatch = useDispatch()
    const { content, head, icon, callback, buttonText } = useSelector(state => state.modalController);
    const callbackHandler = () => {
        if (callback) {
            dispatch(closeModal());
            callback();
        } else dispatch(closeModal());;
    }

    return (
        <View style={styles.container}>
            {iconManager(icon)}
            <Text style={styles.head}>{head}</Text>
            <Text style={styles.content}>{content}</Text>
            <View style={styles.buttonGroup}>
                <Button text={buttonText ? buttonText : 'Close'} variant='outlined' callback={() => callbackHandler()} />
            </View>
        </View >
    )
}

export default InfoTypeModal


