# MCP field notes

## How do you explain MCP over dinner?

*Opening discussion, 18 November 2026. These notes capture the argument and the experiments it suggested. The linked implementations were discussed as examples. The experiments below are proposals.*

“Make me a slide showing where our team keeps its files.” An assistant can describe that slide. Connect it to Teams Personas and it can also hand a fictional scenario to our renderer and bring back the image. **MCP is the shared language the assistant app and the tool use to discover what the tool offers, ask it to do something and receive the result.** The person can judge the difference by opening the slide.

Teams Personas gives the model a vocabulary for inventing a scenario. People, channels, posts and tasks can recur across several views. The assistant can write a scenario the developer never anticipated, while the application checks whether it understands the project and can render it. A person using the editor and a script using the CLI can work with the same project. [Teams Personas](https://github.com/blackmath88/msteams-personas)

### Where does the work actually happen?

Follow one local render. Each step answers a different infrastructure question.

| Step | Participant | What happens |
| --- | --- | --- |
| Interpret | Model | Turns the trainer’s request into proposed arguments for `render_project`. Inference runs wherever the model is hosted. |
| Authorise and dispatch | Assistant host and its MCP client | The host governs which connections and actions are available. The client sends the request over the configured connection. |
| Receive | Teams Personas MCP server | A process accepts the arguments and calls the application. “Server” can mean a local process talking over standard input and output, or a service reached over HTTP. |
| Execute | Validator and renderer | Application code checks the project. In the local render path, Node serves a page on loopback and headless Chromium renders it on that machine. |
| Return and inspect | Client, host and trainer | The host receives the result and determines what to show or pass to the model. The trainer can open the image and decide whether it explains the filing structure. |

An API describes how to ask for work. The handler determines where the work happens. A deterministic client can make the same request without model inference. Conversely, a renderer can run on a laptop while the host sends project arguments or a preview to a cloud model. To locate the trust boundary, trace the data in both directions. [MCP architecture](https://modelcontextprotocol.io/docs/learn/architecture) · [Personas renderer](https://github.com/blackmath88/msteams-personas/blob/main/tools/render.mjs)

### Which interface owns the selected room?

| Entry point | Where the action begins | What “this room” means |
| --- | --- | --- |
| MCP server | An assistant client calls an advertised tool. The editor can be closed. | The caller supplies the project and room identity, or refers to state the service holds. |
| MCP App | The tool supplies an interactive view inside a compatible assistant host. | A click or drag can identify the room. The app must communicate the relevant edit back for a follow-up to use it. |
| WebMCP | An open website advertises a structured action through a handler or annotated form to a compatible browser agent. | The page can resolve the current selection and unsaved draft itself. |
| Browser automation | An agent inspects and operates the existing interface. | The agent identifies the room through available controls, accessibility information or pixels. |

**Does WebMCP need server-side compute?** Moving a room in a JavaScript draft can happen entirely in the tab. Saving it may call an authenticated backend. Exporting a slide could submit a job to another machine. The page can expose any of these actions without connecting to an LLM itself. WebMCP is a proposed web standard. Availability depends on the browser and agent. [Chrome WebMCP](https://developer.chrome.com/docs/ai/webmcp) · [MCP Apps](https://github.com/modelcontextprotocol/ext-apps) · [Playwright MCP](https://github.com/microsoft/playwright-mcp)

### How wide is the spectrum?

Tools let a client request operations. Servers can also offer readable resources and reusable prompts. The consequences depend on the software behind the connection. Searching Hugging Face returns evidence. Opening a GitHub issue changes what colleagues see. ROOT can calculate a histogram from a physics dataset. Blender can change an object that both the artist and the assistant can edit again. Home Assistant can act on a physical device. A remote job can keep using compute after the conversation moves on. [Hugging Face](https://huggingface.co/docs/hub/en/agents-mcp) · [GitHub](https://github.com/github/github-mcp-server) · [ROOT-MCP](https://github.com/mohamedelashri/root-mcp) · [Blender MCP](https://github.com/ahujasid/blender-mcp) · [Home Assistant](https://www.home-assistant.io/integrations/mcp_server/)

### Can the assistant invent the tool it needs?

Cloudflare’s Code Mode makes this question precise. Developers supply an API, searchable descriptions, an execution environment and credentials with a defined reach. At the moment of use, an assistant can write a small program combining available operations to answer a question nobody designed a button for. **The feature can begin as a single example of use.** Keeping the program, its inputs and its checks could turn that one-off into a repeatable tool owned by the person who needed it. That last step is our design hypothesis. [Cloudflare Code Mode](https://blog.cloudflare.com/code-mode-mcp/) · [Implementation](https://github.com/cloudflare/mcp)

Other edges change different parts of the relationship:

- **Discover a capability during work.** Docker’s experimental gateway can find and add MCP servers. Our Open Data Explorer discovers candidate datasets. In each case, discovery gives you a candidate. Suitability and permission to send it data are separate decisions. [Docker Dynamic MCP](https://docs.docker.com/ai/mcp-catalog-and-toolkit/dynamic-mcp/) · [DataFit](https://github.com/blackmath88/opendata-explorer)
- **Let software ask for judgement.** Through sampling, a server can ask a supporting client for a model completion. This can involve a single model. Through elicitation, a server can ask for human input. A proposed Personas example would measure an overflowing label, request shorter variants, measure them again and let the trainer judge which preserves the meaning. [MCP specification](https://modelcontextprotocol.io/specification)
- **Let a gesture answer the assistant.** tldraw demonstrates an editable canvas inside chat. The Blackboard question is what survives the exchange. If a person moves a room, can the assistant explain the revised arrangement? Can the person see why a pane appeared, who accepted it and which revision it represents? [tldraw MCP App](https://tldraw.dev/blog/tldraw-mcp-app) · [Blackboard pilot report](https://github.com/blackmath88/blackboard-nextgenui/blob/main/pilot/app/REPORT.md)

### What would an MCP Lab let someone discover?

PDF Lab and XL Lab put a visible document beside the evidence a reader or tool can extract. Borrow that method. Hold the question constant, change one condition, and show the actual input, call, returned evidence and resulting state. [PDF Lab](https://github.com/blackmath88/baselhack26-open-presence/tree/main/sideprojects/pdf-lab) · [XL Lab](https://github.com/blackmath88/xl-lab)

| Proposed exhibit | What to change | What would count as evidence? |
| --- | --- | --- |
| Make a slide | Connect or disconnect the renderer. Then supply a scene that cannot fit. | A preview that opens after a successful call. A specific diagnostic and an inspection of the output directory after failure. |
| Read the poem | Give the assistant text extraction, a page image, then both for the same paired-poem PDF. | Display the exact text and image alongside each answer. Can the reader explain the disagreement? |
| Move one room | Supply a PNG, then an editable project, then a shared canvas. Have the person move the room before asking the assistant to put it back. | The same room ID across edits, a before-and-after diff, and evidence that undo preserved an unrelated human edit. |
| Keep the comparison | Compose a comparison from two public datasets, validate it with DataFit, and offer it as a Blackboard pane. Reopen it with a different assistant and change the district. | A saved recipe with inputs, compatibility checks and provenance that explains why the second result changed. |

A visitor should leave able to answer five questions about a single run. **Who chose the action? Who authorised it? Where did it execute? Which state changed? What evidence reached the model and the person?** The most interesting failure may be a perfectly successful tool call that answered the wrong question.
