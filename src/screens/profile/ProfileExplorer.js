import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from ".";
import { SettingsScreen } from "../settings";
import QRScreen from "../qr";
import FAQScreen from "../settings/faq";
import TermsAndCondition from "../settings/terms";

const Stack = createNativeStackNavigator();
const ProfileExplorer = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SettingsScreen"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TermsAndCondition"
                component={TermsAndCondition}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="FAQScreen"
                component={FAQScreen}
                options={{ headerShown: false }}
            />
            {/* <Stack.Screen
                name="DetailsScreen"
                component={DetailsScreen}
                options={{ headerShown: false }}
            /> */}
            <Stack.Screen
                name="QRScreen"
                component={QRScreen}
                options={{
                    headerShown: false, tabBarVisible: false,
                }}
            />
        </Stack.Navigator>
    );
}

export default ProfileExplorer