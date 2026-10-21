# Apple Skills Index

Select the smallest applicable skill set. Paths are relative to the package root.

## Swift core

| Skill | Load when |
|---|---|
| `swift-language` | Writing or reviewing modern Swift language code outside specialized UI/concurrency concerns |
| `swift-api-design-guidelines` | Naming, labeling, documenting or reviewing public/internal Swift APIs |
| `swift-architecture` | Choosing, reviewing or migrating app architecture |
| `swift-concurrency` | Async/await, actors, isolation, Sendable or data-race work |
| `swift-testing` | Creating or migrating tests with the Swift Testing framework |
| `swift-codable` | Encoding, decoding or mapping JSON/property-list models |
| `swiftdata` | Building or reviewing SwiftData models, queries and migrations |

## SwiftUI

| Skill | Load when |
|---|---|
| `swiftui-patterns` | Building or reviewing modern SwiftUI state, composition and view architecture |
| `swiftui-layout-components` | Stacks, grids, lists, forms, scrolling and adaptive layout |
| `swiftui-navigation` | NavigationStack, split views, sheets, tabs or deep links |
| `swiftui-animation` | Springs, transitions, matched geometry, phase/keyframe animation |
| `swiftui-gestures` | Tap, drag, long press, magnify, rotate or gesture composition |
| `swiftui-liquid-glass` | Native Liquid Glass APIs, fallbacks and related review |
| `swiftui-performance` | Slow rendering, scrolling, animation, hangs or Instruments-backed diagnosis |

## Services and security

| Skill | Load when |
|---|---|
| `ios-networking` | URLSession, REST APIs, downloads/uploads and network reliability |
| `authentication` | Sign in with Apple, passkeys, WebAuthn or LocalAuthentication |
| `cryptokit` | Hashing, HMAC, encryption, signing, key agreement or Secure Enclave primitives |

## Product quality

| Skill | Load when |
|---|---|
| `ios-accessibility` | VoiceOver, Dynamic Type, focus, keyboard and accessibility audits |
| `ios-localization` | String Catalogs, locale-aware content and internationalization |
| `app-store-review` | Submission readiness, privacy manifests and rejection-risk review |

## Common combinations

```text
New SwiftUI screen:
swiftui-patterns + swiftui-layout-components

Navigation-heavy feature:
swiftui-patterns + swiftui-navigation

Animated Liquid Glass UI:
swiftui-liquid-glass + swiftui-animation + ios-accessibility

API-backed SwiftUI feature:
swiftui-patterns + ios-networking + swift-codable + swift-concurrency

Persistent application feature:
swiftui-patterns + swiftdata + swift-concurrency + swift-testing

Authentication flow:
authentication + swift-concurrency + swift-testing

Release readiness:
app-store-review + ios-accessibility + ios-localization
```

Do not load a full combination when one skill is sufficient.

## Paths

Each selected skill is stored at:

```text
instructions/modules/apple/skills/<skill-name>/SKILL.md
```

Each skill may contain `references/`. Read only the references required by that skill and the current task.

