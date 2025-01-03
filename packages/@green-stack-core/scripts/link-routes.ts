import fs from 'fs'
import { excludeDirs, parseWorkspaces, globRel } from './helpers/scriptUtils'

/* --- Constants ------------------------------------------------------------------------------- */

const genMsg = `// -i- Automatically generated by 'npx turbo @green-stack/core#link:routes', do not modify manually, it will get overwritten`

const manifestTemplate = `${genMsg}
export const routeManifest = {
{{routeManifestLines}}
} as const

// eslint-disable-next-line @typescript-eslint/ban-types
export type KnownRoutes = keyof typeof routeManifest | (string & {})
`

/* --- link-routes ----------------------------------------------------------------------------- */

const linkRoutes = () => {
  try {
    // Keep track of routes to save manifest
    const routeManifest = {} as ObjectType<any$Todo>

    // Get all route paths in the features & package folders
    const packageRoutePaths = globRel('../../packages/**/routes/**/*.{ts,tsx}').filter(excludeDirs)
    const featureRoutePaths = globRel('../../features/**/routes/**/*.{ts,tsx}').filter(excludeDirs)
    const allRoutePaths = [...packageRoutePaths, ...featureRoutePaths]

    // Determine each route type
    const layoutRoutes = allRoutePaths.filter((pth) => pth.includes('layout.ts')) // e.g. "/**/layout.tsx"
    const templateRoutes = allRoutePaths.filter((pth) => pth.includes('template.ts')) // e.g. "/**/template.tsx"
    const errorRoutes = allRoutePaths.filter((pth) => pth.includes('error.ts')) // e.g. "/**/error.tsx"
    const loadingRoutes = allRoutePaths.filter((pth) => pth.includes('loading.ts')) // e.g. "/**/loading.tsx"
    const notFoundRoutes = allRoutePaths.filter((pth) => pth.includes('not-found.ts')) // e.g. "/**/not-found.tsx"
    const opengraphImageRoutes = allRoutePaths.filter((pth) => pth.includes('opengraph-image.ts')) // e.g. "/**/not-found.tsx"
    const twitterImageRoutes = allRoutePaths.filter((pth) => pth.includes('twitter-image.ts')) // e.g. "/**/not-found.tsx"
    const apiRoutes = allRoutePaths.filter((pth) => pth.includes('route.ts')) // e.g. "/**/route.tsx"
    const indexRoutes = allRoutePaths.filter((pth) => pth.includes('index.ts')) // e.g. "/**/index.tsx"
    const headRoutes = allRoutePaths.filter((pth) => pth.includes('head.ts')) // e.g. "/**/head.tsx"
    const paramRoutes = allRoutePaths.filter((pth) => pth.includes('].ts')) // e.g. "/**/[slug].tsx"

    // Figure out import paths from each workspace
    const { workspaceImports } = parseWorkspaces()

    // Parse & match each route path to a workspace import
    const parsePath = (pth: string, autoDefault = true) => {
      let screenComponentName = ''
      // Figure out the workspace import
      const [packageParts, routeParts] = pth.split('/routes') as [string, string]
      const workspaceMatcher = packageParts.replace('../../', '')
      const workspacePackageName = workspaceImports[workspaceMatcher]
      // Figure out relevant routing exports
      const nextExports = autoDefault ? ['default'] : ([] as string[])
      const expoExports = autoDefault ? ['default'] : ([] as string[])
      if ([...indexRoutes, ...paramRoutes, ...apiRoutes].includes(pth)) {
        const routeFile = fs.readFileSync(pth, 'utf8')
        // Keep track of which Screen component is used?
        if (routeFile.includes("/screens/"))
          screenComponentName = routeFile.split("/screens/")[1].split("'")[0].trim() // prettier-ignore
        if (routeFile.includes('screen={'))
          screenComponentName = routeFile.split('screen={')[1].split('}')[0]
        if (routeFile.includes('ScreenComponent'))
          screenComponentName = routeFile.split('ScreenComponent')[1].split('=')[1].split('\n')[0].trim() // prettier-ignore
        if (screenComponentName.includes('.'))
          screenComponentName = screenComponentName.split('.').pop() as string
        // Always check if there's a default export when autoDefault is false
        if (!autoDefault && routeFile.includes('default')) nextExports.push('next')
        // Next.js Route Segment Config Exports
        if (routeFile.includes('dynamic')) nextExports.push('dynamic')
        if (routeFile.includes('dynamicParams')) nextExports.push('dynamicParams')
        if (routeFile.includes('revalidate')) nextExports.push('revalidate')
        if (routeFile.includes('fetchCache')) nextExports.push('fetchCache')
        if (routeFile.includes('runtime')) nextExports.push('runtime')
        if (routeFile.includes('preferredRegion')) nextExports.push('preferredRegion')
        if (routeFile.includes('generateStaticParams')) nextExports.push('generateStaticParams')
        // Next.js API Route Method Exports
        if (routeFile.includes('GET')) nextExports.push('GET')
        if (routeFile.includes('POST')) nextExports.push('POST')
        if (routeFile.includes('PUT')) nextExports.push('PUT')
        if (routeFile.includes('PATCH')) nextExports.push('PATCH')
        if (routeFile.includes('DELETE')) nextExports.push('DELETE')
        if (routeFile.includes('HEAD')) nextExports.push('HEAD')
        if (routeFile.includes('OPTIONS')) nextExports.push('OPTIONS')
      } else if ([...opengraphImageRoutes, ...twitterImageRoutes].includes(pth)) {
        const routeFile = fs.readFileSync(pth, 'utf8')
        if (routeFile.includes('alt')) nextExports.push('alt')
        if (routeFile.includes('contentType')) nextExports.push('contentType')
        if (routeFile.includes('size')) nextExports.push('size')
      }
      // Return everything
      return { workspacePackageName, routeParts, nextExports, expoExports, screenComponentName }
    }
    // Clear previous generated route files
    fs.mkdirSync('../../apps/expo/app/(generated)', { recursive: true }) // create empty folder if it doesn't exist
    fs.rmSync('../../apps/expo/app/(generated)', { recursive: true })
    fs.mkdirSync('../../apps/next/app/(generated)', { recursive: true }) // create empty folder if it doesn't exist
    fs.rmSync('../../apps/next/app/(generated)', { recursive: true })
    console.log('-----------------------------------------------------------------')
    console.log("-i- Auto linking routes with 'npx turbo @green-stack/core#link:routes' ...")
    console.log('-----------------------------------------------------------------')

    // Reexport fs based index routing in next & expo app dirs
    indexRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts, nextExports, expoExports, screenComponentName } = parsePath(pth) // prettier-ignore
      const routeSegments = routeParts.split('index.ts')[0]
      if (screenComponentName) routeManifest[routeSegments] = screenComponentName
      const importPath = `${workspacePackageName}/routes${routeSegments}index`
      const expoExportLine = `${genMsg}\nexport { ${expoExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      const nextExportLine = `'use client'\nexport { ${nextExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      fs.mkdirSync(`../../apps/expo/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/expo/app/(generated)${routeSegments}index.tsx`, expoExportLine, {}) // prettier-ignore
      console.log(` ✅ ${routeSegments}   -- Generated from "${pth}"`)
      console.log(`      └── /apps/expo/app/(generated)${routeSegments}index.tsx`)
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}page.tsx`, nextExportLine)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}page.tsx`)
    })
    // Reexport fs based slug routing in next & expo app dirs
    paramRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts, nextExports, expoExports, screenComponentName } = parsePath(pth) // prettier-ignore
      const fileName = routeParts.split('/').pop() as string // e.g. "[slug].tsx"
      const routeParam = fileName.split('.ts')[0] // e.g. "[slug]"
      const routeSegments = routeParts.split(fileName)[0]
      if (screenComponentName) routeManifest[routeSegments] = screenComponentName
      const importPath = `${workspacePackageName}/routes${routeSegments}${routeParam}`
      const expoExportLine = `export { ${expoExports.join(', ')} } from '${importPath}'\n`
      const nextExportLine = `'use client'\n${genMsg}\nexport { ${nextExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      fs.mkdirSync(`../../apps/expo/app/(generated)${routeSegments}${routeParam}`, { recursive: true }) // prettier-ignore
      fs.writeFileSync(`../../apps/expo/app/(generated)${routeSegments}${routeParam}/index.tsx`, expoExportLine) // prettier-ignore
      console.log(` ✅ ${routeSegments}${routeParam}/   -- Generated from "${pth}"`)
      console.log(`      └── /apps/expo/app/(generated)${routeSegments}${routeParam}/index.tsx`)
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}${routeParam}`, { recursive: true }) // prettier-ignore
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}${routeParam}/page.tsx`, nextExportLine) //  prettier-ignore
      console.log(`      └── /apps/next/app/(generated)${routeSegments}${routeParam}/page.tsx`)
    })

    if (layoutRoutes.length || templateRoutes.length || headRoutes.length) console.log('--- \n')

    // Reexport fs based layout routing in next & expo app dirs
    layoutRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('layout.ts')[0]
      const isRootLayout = routeSegments === '/'
      if (!isRootLayout) {
        const importPath = `${workspacePackageName}/routes${routeSegments}layout`
        const exportLine = `'use client'\n${genMsg}\nexport { default } from '${importPath}'\n`
        fs.mkdirSync(`../../apps/expo/app/(generated)${routeSegments}`, { recursive: true })
        fs.writeFileSync(`../../apps/expo/app/(generated)${routeSegments}_layout.tsx`, exportLine)
        console.log(` ✅ ${routeSegments}   -- Layout from "${pth}"`)
        console.log(`      └── /apps/expo/app/(generated)${routeSegments}_layout.tsx`)
        fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
        fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}layout.tsx`, exportLine)
        console.log(`      └── /apps/next/app/(generated)${routeSegments}layout.tsx`)
      }
    })
    // Reexport fs based template routing in next & expo app dirs
    templateRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('template.ts')[0]
      const isRootLayout = routeSegments === '/'
      if (!isRootLayout) {
        const importPath = `${workspacePackageName}/routes${routeSegments}template`
        const exportLine = `'use client'\n${genMsg}\nexport { default } from '${importPath}'\n`
        fs.mkdirSync(`../../apps/expo/app/(generated)${routeSegments}`, { recursive: true })
        fs.writeFileSync(`../../apps/expo/app/(generated)${routeSegments}_layout.tsx`, exportLine)
        console.log(` ✅ ${routeSegments}   -- Template from "${pth}"`)
        console.log(`      └── /apps/expo/app/(generated)${routeSegments}_layout.tsx`)
        fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
        fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}template.tsx`, exportLine)
        console.log(`      └── /apps/next/app/(generated)${routeSegments}template.tsx`)
      }
    })
    // Reexport fs based head config in next app dir
    headRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('head.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}head`
      const exportLine = `${genMsg}\nexport { default } from '${importPath}'\n`
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}head.tsx`, exportLine)
      console.log(` ✅ ${routeSegments}   -- Head file from "${pth}"`)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}head.tsx`)
    })

    // Reexport fs based error pages next to app dir
    errorRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('error.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}error`
      const exportLine = `'use client'\n${genMsg}\nexport { default } from '${importPath}'\n`
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}error.tsx`, exportLine)
      console.log(` ✅ ${routeSegments}   -- Error route from "${pth}"`)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}error.tsx`)
    })

    // Reexport fs based error pages next to app dir
    loadingRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('loading.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}error`
      const exportLine = `'use client'\n${genMsg}\nexport { default } from '${importPath}'\n`
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}loading.tsx`, exportLine)
      console.log(` ✅ ${routeSegments}   -- Loading route from "${pth}"`)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}loading.tsx`)
    })

    // Reexport fs based not-found pages to next app dir
    notFoundRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts } = parsePath(pth)
      const routeSegments = routeParts.split('not-found.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}not-found`
      const exportLine = `'use client'\n${genMsg}\nexport { default } from '${importPath}'\n`
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}not-found.tsx`, exportLine)
      console.log(` ✅ ${routeSegments}   -- 404 Not Found route from "${pth}"`)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}not-found.tsx`)
    })

    // Reexport fs based opengraph-image routes to next app dir
    opengraphImageRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts, nextExports } = parsePath(pth)
      const routeSegments = routeParts.split('opengraph-image.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}opengraph-image`
      const exportLine = `${genMsg}\nexport { ${nextExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      fs.mkdirSync(`../../apps/next/app/${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/${routeSegments}opengraph-image.tsx`, exportLine) // prettier-ignore
      console.log(` ✅ ${routeSegments}   -- opengraph-image route from "${pth}"`)
      console.log(`      └── /apps/next/app/${routeSegments}opengraph-image.tsx`)
    })

    // Reexport fs based twitter-image routes to next app dir
    twitterImageRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts, nextExports } = parsePath(pth)
      const routeSegments = routeParts.split('twitter-image.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}twitter-image`
      const exportLine = `${genMsg}\nexport { ${nextExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      fs.mkdirSync(`../../apps/next/app/${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/${routeSegments}twitter-image.tsx`, exportLine) // prettier-ignore
      console.log(` ✅ ${routeSegments}   -- twitter-image route from "${pth}"`)
      console.log(`      └── /apps/next/app/${routeSegments}twitter-image.tsx`)
    })

    if (apiRoutes.length) console.log('--- \n')

    // Reexport fs based api handler routes in next app dir
    apiRoutes.forEach((pth) => {
      const { workspacePackageName, routeParts, nextExports } = parsePath(pth, false)
      const routeSegments = routeParts.split('route.ts')[0]
      const importPath = `${workspacePackageName}/routes${routeSegments}route`
      const nextExportLine = `${genMsg}\nexport { ${nextExports.join(', ')} } from '${importPath}'\n` // prettier-ignore
      fs.mkdirSync(`../../apps/next/app/(generated)${routeSegments}`, { recursive: true })
      fs.writeFileSync(`../../apps/next/app/(generated)${routeSegments}route.ts`, nextExportLine)
      console.log(` ✅ ${routeSegments}   -- API Route from "${pth}"`)
      console.log(`      └── /apps/next/app/(generated)${routeSegments}route.ts`)
    })

    // Save route manifest
    const routeManifestPath = '../../packages/@registries/routeManifest.generated.ts'
    const routeManifestLines = Object.entries(routeManifest).map(([route, compName]) => {
      const routePath = route === '/' ? '/' : route.substring(0, route.length - 1) // prettier-ignore
      return `  ['${routePath}']: '${compName}',`
    }).join('\n') // prettier-ignore
    const routeManifestFile = manifestTemplate.replace('{{routeManifestLines}}', routeManifestLines) // prettier-ignore
    fs.writeFileSync(routeManifestPath, routeManifestFile)
  } catch (err) {
    console.log(err)
    console.error(err)
    process.exit(1)
  }
}

/* --- init ------------------------------------------------------------------------------------ */

linkRoutes()
