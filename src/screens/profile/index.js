import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { spacesCommands } from '../../constants'
import { Layout } from '../../layout'
import { dequeue } from '../../reducers/refreshQueueReducer'
import { setScreenBehavior } from '../../reducers/screenControllerReducer'
import { GetOccupiedSpace } from '../../utils/data-transmission-utils'
import { storageInfo } from '../../utils/essential-functions'
import { DetailsScreen } from '../details'

const ProfileScreen = ({ route, navigation }) => {
    const { connection } = useSelector(state => state.network);
    const { screensQueue } = useSelector(state => state.refreshReducer);
    const dispatch = useDispatch();


    const getAll = () => {
        dispatch(setScreenBehavior({ routeName: 'ProfileScreen', loader: true, blocker: false }))
        Promise.all([storageInfo(), GetOccupiedSpace("", spacesCommands.document), GetOccupiedSpace("", spacesCommands.image), GetOccupiedSpace("", spacesCommands.video), GetOccupiedSpace("", spacesCommands.music), GetOccupiedSpace("", spacesCommands.other)]).then(() => {
            dispatch(setScreenBehavior({ routeName: 'ProfileScreen', loader: false, blocker: false }))
        })
    }

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (screensQueue.includes(route.name) && connection) {
                getAll()
                dispatch(dequeue(route.name))
            }
        });
        return unsubscribe;
    }, [screensQueue, navigation])



    return (
        <Layout name={route.name}>
            <DetailsScreen />
        </Layout >
    )
}

export default ProfileScreen