const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  // 既存データ削除（参照整合性の順）
  await prisma.club.deleteMany()
  await prisma.user.deleteMany()
  await prisma.university.deleteMany()

  // 大学データ（代表10件、name/reading は別フィールド）
  const universityData = [
    { name: "東京大学", domain: "u-tokyo.ac.jp", reading: "とうきょうだいがく" },
    { name: "京都大学", domain: "kyoto-u.ac.jp", reading: "きょうとだいがく" },
    { name: "早稲田大学", domain: "waseda.jp", reading: "わせだだいがく" },
    { name: "慶應義塾大学", domain: "keio.ac.jp", reading: "けいおうぎじゅくだいがく" },
    { name: "大阪大学", domain: "osaka-u.ac.jp", reading: "おおさかだいがく" },
    { name: "名古屋大学", domain: "nagoya-u.ac.jp", reading: "なごやだいがく" },
    { name: "九州大学", domain: "kyushu-u.ac.jp", reading: "きゅうしゅうだいがく" },
    { name: "北海道大学", domain: "hokudai.ac.jp", reading: "ほっかいどうだいがく" },
    { name: "東北大学", domain: "tohoku.ac.jp", reading: "とうほくだいがく" },
    { name: "筑波大学", domain: "tsukuba.ac.jp", reading: "つくばだいがく" },
  ]

  // 大学を投入（ID取得のため create で配列化）
  const universities = []
  for (const data of universityData) {
    const u = await prisma.university.create({
      data: {
        name: data.name,
        domain: data.domain,
        reading: data.reading,
      },
    })
    universities.push(u)
  }

  console.log("Created universities:", universities.map(u => u.name).join(", "))

  // Create test users
  const hashedPassword = await bcrypt.hash("testpassword", 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        passwordDigest: hashedPassword,
        universityId: universities[0].id,
        authProvider: "password",
      },
    }),
    prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
        passwordDigest: hashedPassword,
        universityId: universities[1].id,
        authProvider: "password",
      },
    }),
  ])

  console.log("Created test users:", users.map(u => u.email).join(", "))

  // 各大学に5個のサークルを作成
  const clubData = [
    // 東京大学
    { universityName: "東京大学", name: "テニスサークル", memberCount: 25, description: "初心者から上級者まで楽しめるテニスサークルです。週2回の練習で技術向上を目指します。" },
    { universityName: "東京大学", name: "写真部", memberCount: 15, description: "街歩きや風景撮影を楽しむ写真部です。月1回の展示会も開催しています。" },
    { universityName: "東京大学", name: "軽音楽部", memberCount: 20, description: "バンド活動を中心とした軽音楽部です。学園祭での演奏を目標に活動しています。" },
    { universityName: "東京大学", name: "ボランティアサークル", memberCount: 30, description: "地域貢献活動を行うボランティアサークルです。様々な社会問題に取り組んでいます。" },
    { universityName: "東京大学", name: "囲碁将棋部", memberCount: 12, description: "囲碁と将棋を楽しむ部活です。初心者も大歓迎で、定期的に大会も開催しています。" },

    // 京都大学
    { universityName: "京都大学", name: "茶道部", memberCount: 18, description: "日本の伝統文化である茶道を学ぶ部活です。月2回の茶会を開催しています。" },
    { universityName: "京都大学", name: "山岳部", memberCount: 22, description: "京都の山々を中心に登山活動を行う山岳部です。四季を通じて自然を楽しみます。" },
    { universityName: "京都大学", name: "文芸部", memberCount: 16, description: "小説や詩の創作活動を行う文芸部です。部誌の発行も行っています。" },
    { universityName: "京都大学", name: "映画研究会", memberCount: 14, description: "映画鑑賞と制作を行う研究会です。学生映画祭への参加も予定しています。" },
    { universityName: "京都大学", name: "料理研究会", memberCount: 20, description: "様々な料理を作って楽しむ研究会です。各国の料理にも挑戦しています。" },

    // 早稲田大学
    { universityName: "早稲田大学", name: "ダンスサークル", memberCount: 35, description: "ヒップホップやジャズダンスを中心としたダンスサークルです。学園祭でのパフォーマンスが目標です。" },
    { universityName: "早稲田大学", name: "サッカー部", memberCount: 28, description: "フットサルを中心としたサッカー部です。週3回の練習で技術向上を目指します。" },
    { universityName: "早稲田大学", name: "演劇部", memberCount: 24, description: "舞台演劇を中心とした演劇部です。年2回の公演を目標に活動しています。" },
    { universityName: "早稲田大学", name: "国際交流サークル", memberCount: 40, description: "留学生との交流を深めるサークルです。多様な文化に触れることができます。" },
    { universityName: "早稲田大学", name: "プログラミング部", memberCount: 32, description: "プログラミング技術を学び合う部活です。ハッカソンへの参加も積極的に行っています。" },

    // 慶應義塾大学
    { universityName: "慶應義塾大学", name: "ゴルフ部", memberCount: 15, description: "ゴルフを楽しむ部活です。初心者から上級者まで幅広く受け入れています。" },
    { universityName: "慶應義塾大学", name: "ディベート部", memberCount: 18, description: "論理的思考力を鍛えるディベート部です。全国大会への出場を目指しています。" },
    { universityName: "慶應義塾大学", name: "投資研究会", memberCount: 25, description: "投資や金融について学ぶ研究会です。模擬取引や勉強会を開催しています。" },
    { universityName: "慶應義塾大学", name: "ラグビー部", memberCount: 30, description: "ラグビーを楽しむ部活です。体力向上とチームワークを重視しています。" },
    { universityName: "慶應義塾大学", name: "起業部", memberCount: 20, description: "起業やビジネスについて学ぶ部活です。ビジネスプランコンテストにも参加しています。" },

    // 大阪大学
    { universityName: "大阪大学", name: "落語研究会", memberCount: 12, description: "落語を学び、発表する研究会です。関西の伝統文化を楽しんでいます。" },
    { universityName: "大阪大学", name: "バスケットボール部", memberCount: 26, description: "バスケットボールを楽しむ部活です。男女混合で活動しています。" },
    { universityName: "大阪大学", name: "漫画研究会", memberCount: 22, description: "漫画の創作と研究を行う研究会です。同人誌の制作も行っています。" },
    { universityName: "大阪大学", name: "環境サークル", memberCount: 28, description: "環境問題について学び、活動するサークルです。地域の清掃活動も行っています。" },
    { universityName: "大阪大学", name: "カフェ研究会", memberCount: 16, description: "コーヒーやカフェ文化について学ぶ研究会です。バリスタ技術の習得も目指しています。" },

    // 名古屋大学
    { universityName: "名古屋大学", name: "バドミントン部", memberCount: 24, description: "バドミントンを楽しむ部活です。初心者から上級者まで歓迎しています。" },
    { universityName: "名古屋大学", name: "天文部", memberCount: 14, description: "天体観測や天文学について学ぶ部活です。定期的に観測会を開催しています。" },
    { universityName: "名古屋大学", name: "手話サークル", memberCount: 18, description: "手話を学び、聴覚障害者との交流を深めるサークルです。" },
    { universityName: "名古屋大学", name: "ロボット研究会", memberCount: 20, description: "ロボット制作やプログラミングを学ぶ研究会です。ロボコンへの参加も予定しています。" },
    { universityName: "名古屋大学", name: "書道部", memberCount: 16, description: "書道を学び、日本の伝統文化に触れる部活です。展覧会への出品も行っています。" },

    // 九州大学
    { universityName: "九州大学", name: "サーフィン部", memberCount: 12, description: "福岡の海でサーフィンを楽しむ部活です。初心者も大歓迎です。" },
    { universityName: "九州大学", name: "太鼓部", memberCount: 15, description: "和太鼓を演奏する部活です。地域のイベントでの演奏も行っています。" },
    { universityName: "九州大学", name: "農業研究会", memberCount: 18, description: "農業について学び、実際に野菜を育てる研究会です。" },
    { universityName: "九州大学", name: "ヨガサークル", memberCount: 22, description: "ヨガを通じて心身の健康を目指すサークルです。初心者向けのクラスもあります。" },
    { universityName: "九州大学", name: "国際ボランティア部", memberCount: 25, description: "海外でのボランティア活動を行う部活です。国際協力について学んでいます。" },

    // 北海道大学
    { universityName: "北海道大学", name: "スキー部", memberCount: 20, description: "北海道の雪を活かしたスキー部です。初心者から上級者まで歓迎しています。" },
    { universityName: "北海道大学", name: "アイスホッケー部", memberCount: 16, description: "アイスホッケーを楽しむ部活です。冬のスポーツを満喫できます。" },
    { universityName: "北海道大学", name: "自然観察会", memberCount: 14, description: "北海道の自然を観察し、学ぶ会です。野生動物の観察も行っています。" },
    { universityName: "北海道大学", name: "スノーボード部", memberCount: 18, description: "スノーボードを楽しむ部活です。雪山での活動を中心としています。" },
    { universityName: "北海道大学", name: "郷土料理研究会", memberCount: 12, description: "北海道の郷土料理について学ぶ研究会です。実際に料理を作って楽しんでいます。" },

    // 東北大学
    { universityName: "東北大学", name: "剣道部", memberCount: 16, description: "剣道を通じて精神を鍛える部活です。礼儀作法も重視しています。" },
    { universityName: "東北大学", name: "合唱部", memberCount: 24, description: "合唱を通じて音楽を楽しむ部活です。定期演奏会も開催しています。" },
    { universityName: "東北大学", name: "地域活性化サークル", memberCount: 20, description: "地域の活性化に取り組むサークルです。地域イベントの企画も行っています。" },
    { universityName: "東北大学", name: "アニメ研究会", memberCount: 28, description: "アニメの鑑賞と研究を行う研究会です。アニメイベントの企画も行っています。" },
    { universityName: "東北大学", name: "柔道部", memberCount: 18, description: "柔道を通じて心身を鍛える部活です。初心者から上級者まで歓迎しています。" },

    // 筑波大学
    { universityName: "筑波大学", name: "陸上競技部", memberCount: 30, description: "陸上競技を楽しむ部活です。短距離から長距離まで幅広く活動しています。" },
    { universityName: "筑波大学", name: "水泳部", memberCount: 22, description: "水泳を通じて体力向上を目指す部活です。競泳から水球まで楽しめます。" },
    { universityName: "筑波大学", name: "科学実験研究会", memberCount: 16, description: "様々な科学実験を行う研究会です。理科の楽しさを体験できます。" },
    { universityName: "筑波大学", name: "バレーボール部", memberCount: 26, description: "バレーボールを楽しむ部活です。男女混合で活動しています。" },
    { universityName: "筑波大学", name: "心理学研究会", memberCount: 18, description: "心理学について学び、実験を行う研究会です。人間の行動について研究しています。" },
  ]

  // サークルを作成
  const clubs = []
  for (const clubInfo of clubData) {
    const university = universities.find(u => u.name === clubInfo.universityName)
    if (university) {
      const club = await prisma.club.create({
        data: {
          universityId: university.id,
          ownerId: users[0].id, // テストユーザーをオーナーとして設定
          name: clubInfo.name,
          memberCount: clubInfo.memberCount,
          description: clubInfo.description,
        },
      })
      clubs.push(club)
    }
  }

  console.log(`Created ${clubs.length} clubs across ${universities.length} universities`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })