import { expect, test } from '@playwright/test'

test('discovers Quickstart, renders its real app, refreshes inside it, and observes a stop', async ({
  page,
}) => {
  const pageErrors: Array<string> = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/')
  await page.getByRole('link', { name: 'Live workbench' }).click()
  await expect(
    page.getByRole('heading', { name: 'Live workbench' }),
  ).toBeVisible()

  const discover = page.getByRole('button', { name: 'Discover tools' })
  await discover.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'get-time App' })).toBeVisible()
  const wire = page.getByRole('region', { name: 'Backstage' })
  await expect(wire.getByText('tools/list #1', { exact: true })).toBeVisible()
  await wire
    .getByText('MCP Lens · advertised interface', { exact: true })
    .click()
  await expect(
    wire.getByText('The tool advertises a view resource.'),
  ).toBeVisible()
  await expect(wire.getByText('Unknown from this listing')).toBeVisible()

  await page.getByRole('button', { name: 'Open time app' }).click()
  await expect(page.getByText('Apps bridge initialized')).toBeVisible()
  const outer = page.locator('iframe[title="MCP Apps sandbox"]')
  const sandboxOrigin = new URL((await outer.getAttribute('src')) ?? '').origin
  expect(sandboxOrigin).not.toBe(new URL(page.url()).origin)
  expect(await outer.getAttribute('sandbox')).toBe(
    'allow-scripts allow-same-origin',
  )
  const inner = outer.contentFrame().locator('iframe[title="Upstream MCP App"]')
  expect(await inner.getAttribute('sandbox')).toBe('allow-scripts')
  const app = inner.contentFrame()
  const clock = app.locator('#server-time')
  await expect(clock).toHaveText(/^\d{4}-\d{2}-\d{2}T.*Z$/)
  const first = await clock.textContent()
  await expect(
    wire.getByText('resources/read #3', { exact: true }),
  ).toBeVisible()

  await app.getByRole('button', { name: 'Get Server Time' }).click()
  await expect(clock).not.toHaveText(first ?? '')
  await expect(page.getByText('get-time · App requested')).toBeVisible()
  await expect(wire.getByText('tools/call #4', { exact: true })).toBeVisible()
  await expect(wire.getByRole('heading', { name: 'App ↔ Host' })).toBeVisible()

  await page.getByRole('button', { name: 'Stop specimen' }).click()
  await expect(
    page.getByText('Specimen stopped.', { exact: false }),
  ).toBeVisible()
  await app.getByRole('button', { name: 'Get Server Time' }).click()
  await expect(clock).toHaveText(/not connected/i)
  await expect(page.getByRole('alert')).toHaveText(/not connected/i)
  await expect(wire.getByText('Call failed', { exact: true })).toBeVisible()
  await expect(wire.getByText('tools/call #5', { exact: true })).toHaveCount(0)
  expect(pageErrors).toEqual([])
})

test('uses Everything and observes a synthetic denied edit on a narrow screen', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/live.html')
  await page
    .getByRole('button', { name: 'Everything Live MCP', exact: true })
    .click()
  await page.getByRole('button', { name: 'Discover tools' }).click()
  await expect(
    page.getByRole('button', { name: 'echo', exact: true }),
  ).toBeVisible()
  await page
    .getByRole('textbox', { name: 'Message' })
    .fill('Narrow viewport, real Echo')
  await page.getByRole('button', { name: 'Run tool' }).click()
  await expect(
    page.getByText('Echo: Narrow viewport, real Echo', { exact: true }),
  ).toBeVisible()
  const wire = page.getByRole('region', { name: 'Backstage' })
  await expect(
    wire.getByText('mcp-servers/everything · 2.3.1', { exact: true }),
  ).toBeVisible()

  await page
    .getByRole('button', {
      name: 'Permission slip Live MCP · synthetic data',
      exact: true,
    })
    .click()
  await expect(
    page.getByText('Echo: Narrow viewport, real Echo', { exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Discover tools' }).click()
  await page.getByRole('button', { name: 'Run tool' }).click()
  const stage = page.getByRole('region', { name: 'Onstage' })
  await expect(stage.getByText(/denied the viewer’s request/)).toBeVisible()
  await page.getByRole('radio', { name: 'Editor' }).check()
  await page.getByRole('button', { name: 'Run tool' }).click()
  await expect(
    stage.getByText(/The editor moved the bridge east/),
  ).toBeVisible()
  expect(
    await page.locator('html').evaluate(html => html.scrollWidth),
  ).toBeLessThanOrEqual(390)
})

test('displays a failed registry request instead of an empty result', async ({
  page,
}) => {
  await page.route('**/api/lab/specimen', route =>
    route.fulfill({
      json: {
        events: [
          {
            seq: 1,
            at: '2026-11-22T10:00:00Z',
            channel: 'Registry REST',
            direction: 'in',
            label: 'HTTP 503',
            detail: '{}',
          },
        ],
        dropped: 0,
        error: 'The official registry returned HTTP 503.',
      },
    }),
  )
  await page.goto('/live.html')
  await page
    .getByRole('button', { name: 'Registry Live REST', exact: true })
    .click()
  await page.getByRole('searchbox', { name: 'Registry query' }).fill('memory')
  await page.getByRole('searchbox', { name: 'Registry query' }).press('Enter')
  await expect(page.getByRole('alert')).toHaveText(
    'The official registry returned HTTP 503.',
  )
  await expect(page.getByText('HTTP 503', { exact: true })).toBeVisible()
  await expect(
    page.getByText('The registry returned no matching records.'),
  ).toHaveCount(0)
})

test('releases the previous MCP session on reload', async ({ page }) => {
  await page.goto('/live.html')
  const onstage = page.getByRole('region', { name: 'Onstage' })
  const connect = onstage.getByRole('button', { name: 'Discover tools' })
  const discovered = onstage.getByRole('button', { name: 'Open time app' })
  const discovery = page.waitForResponse(
    response =>
      response.url().endsWith('/api/lab/specimen') &&
      response.request().postDataJSON()?._tag === 'Connect',
  )
  await connect.click()
  const opened = await (await discovery).json()
  expect(opened.session?.id).toBeTruthy()
  await expect(discovered).toBeVisible()

  await page.reload()
  await connect.click()
  await expect(discovered).toBeVisible()
  await expect
    .poll(async () => {
      const response = await page.request.post('/api/lab/specimen', {
        headers: { Origin: new URL(page.url()).origin },
        data: {
          _tag: 'Call',
          sessionId: opened.session.id,
          tool: 'get-time',
          arguments: {},
          from: 'learner',
        },
      })
      return (await response.json()).error ?? ''
    })
    .toMatch(/expired or is unavailable/)
})

test('carries the Registry query from REST into the discovered MCP adapter', async ({
  page,
}) => {
  await page.goto('/live.html')
  await page
    .getByRole('button', { name: 'Registry Live REST', exact: true })
    .click()
  const stage = page.getByRole('region', { name: 'Onstage' })
  await stage
    .getByRole('searchbox', { name: 'Registry query' })
    .fill('bridge notes')
  await stage.getByRole('button', { name: 'Local MCP adapter' }).click()
  await expect(stage.getByRole('searchbox')).toHaveCount(0)
  await stage.getByRole('button', { name: 'Discover tools' }).click()
  await expect(
    stage.getByRole('searchbox', { name: 'Registry query' }),
  ).toHaveValue('bridge notes')
  await expect(
    stage.getByRole('button', { name: 'Search via MCP' }),
  ).toBeEnabled()
  await expect(
    page.getByRole('button', { name: 'search_registry', exact: true }),
  ).toBeVisible()
  const wire = page.getByRole('region', { name: 'Backstage' })
  await expect(
    wire.getByText('Lab Registry adapter · 1.0.0', { exact: true }),
  ).toBeVisible()
  await expect(wire.getByText('MCP in-process', { exact: true })).toBeVisible()
  await expect(wire.getByText('tools/list #1', { exact: true })).toBeVisible()
})
