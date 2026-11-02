<script setup lang="ts">
import LegalDoc from '~/components/site/LegalDoc.vue'
import { GITHUB_URL } from '~/utils/site'
import type { LegalSection } from '~/utils/site'

useSeoMeta({
  title: 'Terms & Conditions — VOIDTYPE',
  description: 'The terms that apply when you play VOIDTYPE, the 3D space-combat typing game.'
})

const sections: LegalSection[] = [
  {
    id: 'acceptance', title: 'Acceptance of these terms',
    paras: [
      'These Terms & Conditions ("Terms") apply to your use of VOIDTYPE (the "Game"), including this website, the installable web app and the pages that belong to them. VOIDTYPE was created by Itz-Murali and Itz-Anya (the "Creators").',
      'By playing the Game, installing it or using this website you confirm that you have read and agree to these Terms. If you do not agree, please do not use the Game.'
    ]
  },
  {
    id: 'game', title: 'The Game',
    paras: [
      'VOIDTYPE is a free, browser-based 3D typing game. It is provided for entertainment. There is no account, no sign-in, no purchase and no advertising inside the Game.',
      'The Creators may update, change, pause or remove the Game or any feature of it at any time, with or without notice. Scores, records and settings have no monetary value.'
    ]
  },
  {
    id: 'eligibility', title: 'Who can play',
    paras: [
      'The Game is suitable for a general audience. If you are under the age at which you can agree to these Terms where you live, please ask a parent or guardian to review them with you before you play.'
    ]
  },
  {
    id: 'data', title: 'Your data and this device',
    paras: [
      'The Game does not ask you to register and the Creators do not run a player database. Your progress is stored only in your own browser, using local storage on your device:'
    ],
    items: [
      'voidtype:profile holds your career statistics, such as best score, best WPM, runs played and accuracy.',
      'voidtype:settings:v2 holds your preferences, such as audio, graphics quality and reduced motion.',
      'A service worker and browser cache store the Game files so it can start quickly and work offline.'
    ]
  },
  {
    id: 'third-party', title: 'Third-party services',
    paras: [
      'To load, the Game requests some resources from other providers, for example web fonts from Google Fonts and logo and creator images from image hosts. Like any website request, these providers can see technical information such as your IP address and browser type, under their own privacy policies.',
      'Links to GitHub and other outside sites are provided for convenience. The Creators do not control those sites and are not responsible for their content or practices.'
    ]
  },
  {
    id: 'conduct', title: 'Acceptable use',
    paras: ['You agree to use the Game fairly and lawfully. In particular, you will not:'],
    items: [
      'attempt to disrupt, overload or break the website or the services that host it;',
      'use automated tools to scrape or hammer the site in a way that harms other visitors;',
      'remove or hide the Creators\' names or notices, or present the Game as your own work;',
      'copy, modify or redistribute the Game in a way that breaks the License.'
    ]
  },
  {
    id: 'ip', title: 'Ownership and License',
    paras: [
      'The Game, its name, logo, artwork and code are owned by the Creators and are made available under the VOIDTYPE Attribution License. In short: you may use, fork and modify the project, as long as you give clear credit to both Itz-Murali and Itz-Anya and keep the license notice.',
      'The full text and a plain-language summary are on the License page. If anything in these Terms conflicts with the License about use of the source code, the License controls.'
    ]
  },
  {
    id: 'health', title: 'Play comfortably',
    paras: [
      'The Game contains fast motion, bright flashes and sound effects. Take regular breaks, play in a well-lit room and stop if you feel dizzy, uncomfortable or unwell. The Settings menu includes a reduced motion option. If you are sensitive to flashing visuals, please use it or do not play.'
    ]
  },
  {
    id: 'disclaimer', title: 'No warranty',
    paras: [
      'The Game is provided "as is" and "as available", without warranties of any kind, express or implied, including fitness for a particular purpose, uninterrupted availability or freedom from errors. Performance depends on your device, browser and graphics support.'
    ]
  },
  {
    id: 'liability', title: 'Limitation of liability',
    paras: [
      'To the fullest extent permitted by applicable law, the Creators are not liable for any indirect, incidental or consequential loss, or for any loss of data, scores or progress, arising from your use of, or inability to use, the Game. Nothing in these Terms limits any rights or liability that cannot be limited by law.'
    ]
  },
  {
    id: 'changes', title: 'Changes to these Terms',
    paras: [
      'These Terms may be updated from time to time. The date at the top of this page shows when they last changed. If you keep playing after an update, you accept the updated Terms.'
    ]
  },
  {
    id: 'contact', title: 'Contact',
    paras: [
      `Questions, bug reports or concerns about these Terms? Open an issue on the project's GitHub page: ${GITHUB_URL}`
    ]
  }
]
</script>

<template>
  <LegalDoc
    kicker="Legal"
    title="Terms & Conditions"
    lead="Short, plain rules for playing VOIDTYPE. By playing the game you agree to them."
    :sections="sections"
  >
    <div class="doc-cta" data-reveal>
      <p>Ready to fly? Playing means you accept these Terms and the License.</p>
      <div class="doc-cta-row">
        <NuxtLink class="btn primary" to="/">Back to the game</NuxtLink>
        <NuxtLink class="btn" to="/license">Read the License</NuxtLink>
      </div>
    </div>
  </LegalDoc>
</template>
