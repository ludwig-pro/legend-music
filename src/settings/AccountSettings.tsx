import { use$ } from "@legendapp/state/react";
import { Text, View, ScrollView, Linking } from "react-native";
import { Button } from "@/components/Button";
import { settings$ } from "@/systems/Settings";

export function AccountSettings() {
    const isRegistered = use$(settings$.registration.isRegistered);
    const registrationType = use$(settings$.registration.registrationType);

    const handleRegister = () => {
        // TODO: Implement registration flow
        console.log("Register button clicked");
    };

    const handleGetLegendKit = () => {
        Linking.openURL("https://legendapp.com/kit");
    };

    const handleContactSupport = () => {
        // TODO: Add support contact
        console.log("Contact support clicked");
    };

    if (isRegistered) {
        return (
            <ScrollView className="flex-1 p-6">
                <View className="max-w-2xl">
                    <Text className="text-2xl font-bold text-white mb-6">
                        Account
                    </Text>
                    
                    <View className="p-6 bg-green-500/20 rounded-lg border border-green-400/30 mb-6">
                        <Text className="text-xl font-semibold text-white mb-3">
                            ✅ Registered
                        </Text>
                        <Text className="text-white/90 text-base leading-relaxed mb-3">
                            Thank you for supporting Legend Music! Your registration helps us continue 
                            developing amazing music tools and maintaining this open source project.
                        </Text>
                        {registrationType === 'legendkit' && (
                            <Text className="text-white/80 text-sm">
                                You have access to Legend Kit premium features.
                            </Text>
                        )}
                        {registrationType === 'standalone' && (
                            <Text className="text-white/80 text-sm">
                                You have a standalone Legend Music registration.
                            </Text>
                        )}
                    </View>

                    <View className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <Text className="text-white font-medium mb-2">
                            Need Help?
                        </Text>
                        <Text className="text-white/80 text-sm mb-3">
                            If you have any questions or need support, we're here to help.
                        </Text>
                        <Button 
                            onPress={handleContactSupport}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg self-start"
                        >
                            <Text className="text-white font-medium">
                                Contact Support
                            </Text>
                        </Button>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView className="flex-1 p-6">
            <View className="max-w-2xl">
                <Text className="text-2xl font-bold text-white mb-6">
                    Account
                </Text>
                
                <View className="mb-8">
                    <Text className="text-lg font-semibold text-white mb-4">
                        Legend Music is Free & Open Source
                    </Text>
                    <Text className="text-white/80 text-base leading-relaxed mb-4">
                        Legend Music is completely free to use and open source. However, we need your 
                        support to continue improving this app and developing other Legend tools. Your 
                        support helps us dedicate more time to creating amazing music applications.
                    </Text>
                </View>

                <View className="space-y-4 mb-8">
                    <Text className="text-lg font-semibold text-white mb-2">
                        Support Options
                    </Text>
                    
                    {/* Legend Kit Option */}
                    <View className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30">
                        <Text className="text-xl font-semibold text-white mb-3">
                            🚀 Legend Kit (Recommended)
                        </Text>
                        <Text className="text-white/90 text-base leading-relaxed mb-4">
                            Get Legend Kit for the best experience! It includes premium versions of 
                            Legend Music and other Legend apps, plus advanced development tools.
                        </Text>
                        <Text className="text-white/80 text-sm mb-4">
                            Legend Kit includes:
                        </Text>
                        <View className="ml-4 mb-4">
                            <Text className="text-white/80 text-sm">• Premium Legend Music with advanced features</Text>
                            <Text className="text-white/80 text-sm">• Additional Legend apps and tools</Text>
                            <Text className="text-white/80 text-sm">• Advanced UI components and utilities</Text>
                            <Text className="text-white/80 text-sm">• Priority support and updates</Text>
                            <Text className="text-white/80 text-sm">• Access to exclusive development resources</Text>
                        </View>
                        <Button 
                            onPress={handleGetLegendKit}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-lg self-start"
                        >
                            <Text className="text-white font-semibold">
                                Get Legend Kit
                            </Text>
                        </Button>
                    </View>

                    {/* Standalone Option */}
                    <View className="p-6 bg-white/5 rounded-lg border border-white/10">
                        <Text className="text-lg font-semibold text-white mb-3">
                            💝 Standalone Registration - $9
                        </Text>
                        <Text className="text-white/80 text-base leading-relaxed mb-4">
                            Support Legend Music directly with a one-time $9 registration. This helps 
                            fund continued development while keeping the app free and open source for everyone.
                        </Text>
                        <Button 
                            onPress={handleRegister}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-lg self-start"
                        >
                            <Text className="text-white font-medium">
                                Register for $9
                            </Text>
                        </Button>
                    </View>
                </View>

                <View className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <Text className="text-white/80 text-sm leading-relaxed">
                        💡 <Text className="font-medium">Why register?</Text> Your support allows us to spend more time 
                        improving Legend Music, fixing bugs, adding features, and creating new Legend apps. 
                        Even if you choose not to register, you'll always have access to the full app.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}