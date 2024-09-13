import { useState, useEffect, useRef } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, Text, H1, H2, H3, Link, ScrollView, KeyboardAvoidingView } from '../components/styled'
import BackButton from '../components/BackButton'
import { TextInput } from '../forms/TextInput.styled'
import { NumberStepper } from '../forms/NumberStepper.styled'
import { Checkbox } from '../forms/Checkbox.styled'
import { useFormState } from '@green-stack/forms/useFormState'
import { z, schema } from '@green-stack/schemas'
import { useRouteParams, useRouter } from '@green-stack/navigation'
import { CheckList } from '../forms/CheckList.styled'
import { RadioGroup } from '../forms/RadioGroup.styled'
import { Select } from '../forms/Select.styled'
import { Switch } from '../forms/Switch.styled'
import { isEmpty } from '@green-stack/utils/commonUtils'
import { useScrollToFocusedInput } from '@green-stack/hooks/useScrollToFocusedInput'
import { TextArea } from '../forms/TextArea.styled'

/* --- Schema --------------------------------------------------------------------------------- */

const TestForm = schema('TestForm', {
    email: z.string().email().optional(),
    age: z.number().min(1).max(130).optional(),
    identifiesWith: z.string().optional(),
    excitingFeatures: z.array(z.string()).default([]),
    minHourlyPrice: z.number().optional(),
    feedbackSuggestions: z.string().optional(),
})

type TestForm = z.input<typeof TestForm>

/* --- <FormsScreen/> ------------------------------------------------------------------------- */

const FormsScreen = (props: TestForm) => {
    // Nav
    const { setParams } = useRouter()
    const params = useRouteParams(props)

    // Refs
    const emailInputRef = useRef<any$Ignore>(null)
    const ageInputRef = useRef<any$Ignore>(null)
    const feedbackInputRef = useRef<any$Ignore>(null)

    // Hooks
    const kbScroller = useScrollToFocusedInput()

    // State
    const [validateOnChange, setValidateOnChange] = useState(!!params.validateOnChange)
    const [showFormState, setShowFormState] = useState(false)

    // Forms
    const formState = useFormState(TestForm, {
        initialValues: { ...props, ...params },
        validateOnChange,
    })

    // -- Handlers --

    const submitForm = () => {
        setParams(formState.values)
    }

    // -- Effects --

    useEffect(() => {
        if (!validateOnChange && !isEmpty(formState.errors)) formState.updateErrors({})
    }, [validateOnChange])

    useEffect(() => {
        if (!formState.isDefaultState) submitForm()
    }, [formState.values])

    // -- Render --

    return (
        <KeyboardAvoidingView {...kbScroller.avoidingViewProps}>
            <StatusBar style="dark" />
            <ScrollView
                {...kbScroller.scrollViewProps}
                className="flex flex-1 min-h-screen bg-white"
                contentContainerClassName="min-h-screen"
            >
                <View className="flex flex-1 justify-center items-center pt-28 pb-16">
                    <View className="flex flex-col w-full max-w-[500px] px-8">

                        <H1>Forms Demo</H1>

                        <View className="h-4" />

                        {/* -- TextInput -- */}

                        <TextInput
                            placeholder="e.g. thorr@fullproduct.dev"
                            {...formState.getTextInputProps('email')}
                            {...kbScroller.registerInput(emailInputRef)}
                        />

                        <Text className="text-sm text-secondary mt-2">
                            Your email
                        </Text>

                        <View className="h-4" />

                        {/* -- Stepper -- */}

                        <NumberStepper
                            placeholder="e.g. 32"
                            min={18}
                            max={150}
                            step={1}
                            {...formState.getInputProps('age')}
                            {...kbScroller.registerInput(ageInputRef)}
                        />

                        <Text className="text-sm text-secondary mt-2">
                            Your age
                        </Text>

                        <View className="h-6" />

                        {/* -- Checkbox -- */}

                        <Checkbox
                            label="Validate on change?"
                            checked={validateOnChange}
                            onCheckedChange={setValidateOnChange}
                        />

                        <View className="h-1 w-12 my-6 bg-slate-300" />

                        {/* -- Radiogroup -- */}

                        <H2 className="text-black">
                            What role describes you best?
                        </H2>

                        <View className="h-4" />

                        <RadioGroup
                            options={{
                                'full-product-dev': 'Full-stack web or mobile dev',
                                'freelance-app-dev': 'Freelance App Developer',
                            }}
                            {...formState.getInputProps('identifiesWith')}
                        >
                            <RadioGroup.Option value="startup-founder" label="Startup Founder" />
                            <RadioGroup.Option value="indiehacker" label="Indie Hacker" />
                            <RadioGroup.Option value="studio-lead" label="Studio Lead / CEO / Architect" />
                        </RadioGroup>

                        <View className="h-1 w-12 my-6 bg-slate-300" />

                        {/* -- CheckList -- */}

                        <H2 className="text-black">
                            Which DX features excite you?
                        </H2>

                        <View className="h-4" />

                        <CheckList
                            options={{
                                'universal-starter': 'A write-once workflow for Web, iOS & Android',
                                'git-plugins': 'Git based plugin branches & PRs',
                            }}
                            {...formState.getInputProps('excitingFeatures')}
                        >
                            <CheckList.Option value="stack-freedom" label="Pick and choose my own Auth / DB / Mail / ..." />
                            <CheckList.Option value="zod-query-toolkit" label="Auto typed API's + fetching (zod, react-query)" />
                            <CheckList.Option value="generators-scripts" label="Scripts and Generators to save more time" />
                            <CheckList.Option value="designed-for-copypaste" label="Portable structure designed for copy-paste" />
                            <CheckList.Option value="universal-fs-routing" label="Universal fs based routing in Expo and Next.js" />
                        </CheckList>

                        <View className="h-1 w-12 my-6 bg-slate-300" />

                        {/* -- Select -- */}

                        <H2 className="text-black">
                            How do you value your time?
                        </H2>

                        <View className="h-4" />

                        <Select
                            placeholder="Select hourly rate..."
                            options={{
                                '10': '10 - 20 per hour or less',
                                '20': '20 - 50 per hour range',
                            }}
                            value={`${formState.values.minHourlyPrice || ''}`}
                            onChange={(price) => formState.handleChange('minHourlyPrice', +price)}
                        >
                            <Select.Option value="50" label="50 - 75 per hour range" />
                            <Select.Option value="75" label="75 - 100 per hour range" />
                            <Select.Option value="100" label="100 or more per hour" />
                        </Select>

                        <Text className="text-sm text-secondary mt-2">
                            Your hourly rate
                        </Text>

                        <View className="h-1 w-12 my-6 bg-slate-300" />

                        {/* -- TextArea -- */}

                        <H2 className="text-black">
                            What's missing?
                        </H2>

                        <View className="h-4" />

                        <TextArea
                            placeholder="How could we further improve your workflow?"
                            {...formState.getTextInputProps('feedbackSuggestions')}
                            {...kbScroller.registerInput(feedbackInputRef)}
                        />

                        <Text className="text-sm text-secondary mt-2">
                            Feedback or suggestions appreciated
                        </Text>

                        <View className="h-1 w-12 my-6 bg-slate-300" />

                        {/* -- Switch -- */}
                        
                        <Switch
                            label="Show formState"
                            checked={showFormState}
                            onCheckedChange={setShowFormState}
                        />

                        {/* -- useFormstate() -- */}

                        {showFormState && (
                            <>
                                <View className="h-4" />

                                <H3>
                                    <Link
                                        className="text-black no-underline"
                                        href="https://universal-base-starter-docs.vercel.app/quickstart"
                                        target="_blank"
                                    >
                                        {`formState = useFormState( zod )`}
                                    </Link>
                                </H3>

                                <View className="h-2" />

                                <Link
                                    className="no-underline"
                                    href="https://universal-base-starter-docs.vercel.app/quickstart"
                                    target="_blank"
                                >
                                    📗 Read the docs
                                </Link>

                                <View className="h-4" />

                                <Text className="text-start">
                                    {JSON.stringify(formState, null, 2)}
                                </Text>
                            </>
                        )}

                        {kbScroller.keyboardPaddedView}

                    </View>
                </View>

            </ScrollView>
            <BackButton backLink="/subpages/Universal%20Nav" color="#333333" />
        </KeyboardAvoidingView>
    )
}

/* --- Exports --------------------------------------------------------------------------------- */

export default FormsScreen
