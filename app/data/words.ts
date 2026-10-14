const list = (s: string): string[] => s.toUpperCase().split(/\s+/).filter(Boolean)

export const EASY = list(`
apple river cloud stone happy green water light music dance smile ocean tiger eagle bread chair table house
mouse plant sugar candy beach sleep dream brave quick small world earth flame frost grass honey ivory jelly
koala lemon magic night olive pearl queen robot sandy tulip vivid whale yacht zebra amber blaze coral dairy
ember fairy giant heart island juice knife lunch maple noble orbit piano quiet raven shade tooth vocal wheat
young bloom charm drift field glass hello jolly kind laugh melon nurse paper quilt rainy salad toast voice
wagon pizza socks train storm sunny bridge clock river mango panda otter camel fruit grape peach berry lunch
smoke trail lake moon star wind rain snow rock tree leaf bird fish duck frog bear wolf deer lion goat seal
cake rice soup milk tea jam nut corn bean lamp door wall roof road ship boat bike park farm shop book pen
`)

export const MID = list(`
garden window kitchen holiday journey monkey pillow rabbit silver thunder blanket bicycle chicken dolphin
elephant forest giraffe harvest jungle kingdom lantern mirror notebook painter quarter rainbow sandwich
teacher umbrella village weather yellow zipper airport balloon camera diamond engine fashion guitar hammer
insect jacket kitten ladder market napkin orange parrot rocket sailor tunnel velvet wallet whisper blossom
compass dragon feather gallery horizon library morning orchard pumpkin sunrise treasure victory winter
summer autumn spring desert island canyon meadow valley glacier volcano harbor bakery theater museum stadium
cottage fireplace blanket cinnamon avocado biscuit coconut pancake popcorn pretzel spinach tomato walnut
cheetah penguin gorilla hedgehog squirrel panther peacock pelican turtle walrus lobster octopus
courage freedom gentle honest kindness patience wisdom wonder grateful curious cheerful
`)

export const HARD = list(`
adventure butterfly chocolate community discovery education fireworks friendship happiness imagination
lighthouse mountains orchestra paintbrush playground rainforest strawberry sunflower waterfall wilderness
celebration generosity harmonica hurricane invisible jellyfish knowledge landscape nightingale pineapple
quicksilver reflection restaurant skyscraper telescope whirlwind woodpecker wonderland crocodile blueberry
chimpanzee dandelion evergreen fantastic hospitality mysterious photograph sandcastle snowflake thoughtful
wheelbarrow zookeeper marshmallow marketplace moonlight sunshine starlight daydream thunderbolt
`)
