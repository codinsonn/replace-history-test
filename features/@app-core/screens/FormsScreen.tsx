import { useState, useEffect } from 'react'
import { ScrollView } from 'react-native'
import { View, Text, H1, H2, H3, Link } from '../components/styled'
import BackButton from '../components/BackButton'
import { TextInput } from '../forms/TextInput.styled'
import { Checkbox } from '../forms/Checkbox.styled'
import { useFormState } from '@green-stack/forms/useFormState'
import { z, schema } from '@green-stack/schemas'
import { useRouteParams, useRouter } from '@green-stack/navigation'
import { CheckList } from '../forms/CheckList.styled'
import { isEmpty } from '@green-stack/utils/commonUtils'

/* --- Schema --------------------------------------------------------------------------------- */

const TestForm = schema('TestForm', {
  email: z.string().email().default(''),
  age: z.number().optional(),
  identifiesWith: z.array(z.string()).default([]),
  excitingFeatures: z.array(z.string()).default([]),
})

type TestForm = z.input<typeof TestForm>

/* --- <FormsScreen/> ------------------------------------------------------------------------- */

const FormsScreen = (props: TestForm) => {
  // Nav
  const { setParams } = useRouter()
  const params = useRouteParams(props)

  // State
  const [validateOnChange, setValidateOnChange] = useState(!!params.validateOnChange)

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
    <>
      <ScrollView>
        <View className="flex flex-1 justify-center items-center pt-28 pb-16">
          <View className="flex flex-col w-full max-w-[500px] px-8">

            <H1>Forms Demo</H1>

            <View className="h-4" />

            {/* -- TextInput -- */}

            <TextInput
              placeholder="email..."
              placeholderTextColor={'#999999'}
              {...formState.getTextInputProps('email')}
            />

            <View className="h-4" />

            <TextInput
              placeholder="age..."
              placeholderTextColor={'#999999'}
              inputMode="numeric"
              {...formState.getNumberTextInputProps('age')}
            />

            <View className="h-4" />

            {/* -- Checkbox -- */}

            <Checkbox
              label="Validate on change?"
              checked={validateOnChange}
              onCheckedChange={setValidateOnChange}
            />

            <View className="h-1 w-12 my-6 bg-slate-300" />

            {/* -- Radiogroup -- */}

            <H2 className="text-black">
              How do you identify the most?
            </H2>

            <View className="h-4" />

            <CheckList
              options={{ fullproduct: 'Full-stack web Developer' }}
              {...formState.getInputProps('identifiesWith')}
            >
              <CheckList.Option value="startup-founder" label="Startup Founder" />
              <CheckList.Option value="indiehacker" label="Indie Hacker" />
              <CheckList.Option value="studio-lead" label="Studio Lead / CEO / Architect" />
            </CheckList>

            <View className="h-1 w-12 my-6 bg-slate-300" />

            {/* -- CheckList -- */}

            <H2 className="text-black">
              Which features excite you?
            </H2>

            <View className="h-4" />

            <CheckList
              options={{
                'universal-starter': 'Start + Deploy for Web, iOS and Android',
                'git-plugins': 'Git plugin branches to choose my own stack',
              }}
              {...formState.getInputProps('excitingFeatures')}
            >
              <CheckList.Option value="zod-toolkit" label="Toolkit + Way of Working for Zod + react-query" />
              <CheckList.Option value="generators-scripts" label="Scripts and Generators to save more time" />
              <CheckList.Option value="universal-fs-routing" label="Universal fs based routing in Expo and Next.js" />
              <CheckList.Option value="designed-for-copypaste" label="Portable structure designed for copy-paste" />
            </CheckList>

            <View className="h-1 w-12 my-6 bg-slate-300" />

            {/* -- useFormstate -- */}

            <H3 className="text-black">
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

            <Text className="text-start text-muted">
              {JSON.stringify(formState, null, 2)}
            </Text>

          </View>
        </View>
      </ScrollView>
      <BackButton backLink="/subpages/Universal%20Nav" color="#333333" />
    </>
  )
}

/* --- Exports --------------------------------------------------------------------------------- */

export default FormsScreen
