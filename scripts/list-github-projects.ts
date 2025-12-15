import { Octokit } from 'octokit'
import readline from 'readline'
import fs from 'fs'
import path from 'path'

// GitHub token'ı .env dosyasından veya kullanıcıdan al
async function getGitHubToken(): Promise<string> {
  // Önce .env dosyasından kontrol et
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/)
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim()
    }
  }

  // .env'de yoksa kullanıcıdan iste
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('GitHub Personal Access Token giriniz (veya .env dosyasına GITHUB_TOKEN=... ekleyin): ', (token) => {
      rl.close()
      resolve(token.trim())
    })
  })
}

async function listGitHubProjects() {
  try {
    console.log('🔗 GitHub hesabınıza bağlanılıyor...\n')

    const token = await getGitHubToken()

    if (!token) {
      console.error('❌ GitHub token gerekli!')
      console.log('\n📝 Token oluşturmak için:')
      console.log('   1. https://github.com/settings/tokens adresine gidin')
      console.log('   2. "Generate new token" (classic) tıklayın')
      console.log('   3. "repo" iznini seçin')
      console.log('   4. Token\'ı kopyalayın ve .env dosyasına GITHUB_TOKEN=... olarak ekleyin')
      process.exit(1)
    }

    const octokit = new Octokit({
      auth: token
    })

    // Kullanıcı bilgilerini al
    const { data: user } = await octokit.rest.users.getAuthenticated()
    console.log(`✅ Bağlantı başarılı! Kullanıcı: ${user.login} (${user.name || 'İsim belirtilmemiş'})\n`)

    // Tüm repoları al (sayfalama ile)
    console.log('📦 Projeleriniz listeleniyor...\n')
    
    const repos: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const { data: pageRepos } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 100,
        page: page,
        sort: 'updated',
        direction: 'desc'
      })

      repos.push(...pageRepos)
      hasMore = pageRepos.length === 100
      page++
    }

    if (repos.length === 0) {
      console.log('📭 Henüz hiç proje bulunmuyor.')
      return
    }

    // Projeleri kategorilere ayır
    const owned = repos.filter(repo => !repo.fork && repo.owner.login === user.login)
    const forked = repos.filter(repo => repo.fork)
    const archived = repos.filter(repo => repo.archived)
    const publicRepos = repos.filter(repo => repo.visibility === 'public')
    const privateRepos = repos.filter(repo => repo.visibility === 'private')

    console.log('═'.repeat(80))
    console.log(`📊 TOPLAM: ${repos.length} proje`)
    console.log('═'.repeat(80))
    console.log(`   • Sahip olduğunuz: ${owned.length}`)
    console.log(`   • Fork edilmiş: ${forked.length}`)
    console.log(`   • Arşivlenmiş: ${archived.length}`)
    console.log(`   • Public: ${publicRepos.length}`)
    console.log(`   • Private: ${privateRepos.length}`)
    console.log('═'.repeat(80))
    console.log()

    // Projeleri listele
    console.log('📋 PROJELER:\n')
    
    repos.forEach((repo, index) => {
      const badges: string[] = []
      if (repo.fork) badges.push('🔀 Fork')
      if (repo.archived) badges.push('📦 Arşiv')
      if (repo.private) badges.push('🔒 Private')
      if (repo.stargazers_count > 0) badges.push(`⭐ ${repo.stargazers_count}`)
      if (repo.language) badges.push(`💻 ${repo.language}`)

      const badgeStr = badges.length > 0 ? ` [${badges.join(', ')}]` : ''
      
      console.log(`${(index + 1).toString().padStart(3)}. ${repo.name}${badgeStr}`)
      console.log(`     📍 ${repo.html_url}`)
      console.log(`     📝 ${repo.description || 'Açıklama yok'}`)
      console.log(`     📅 Son güncelleme: ${new Date(repo.updated_at).toLocaleDateString('tr-TR')}`)
      console.log()
    })

    // Özet istatistikler
    console.log('═'.repeat(80))
    console.log('📈 İSTATİSTİKLER:')
    console.log('═'.repeat(80))
    
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0)
    const languages = repos
      .filter(repo => repo.language)
      .reduce((acc: Record<string, number>, repo) => {
        acc[repo.language!] = (acc[repo.language!] || 0) + 1
        return acc
      }, {})

    console.log(`   ⭐ Toplam yıldız: ${totalStars}`)
    console.log(`   🔀 Toplam fork: ${totalForks}`)
    console.log(`   💻 Kullanılan diller:`)
    
    const sortedLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
    
    sortedLanguages.forEach(([lang, count]) => {
      const bar = '█'.repeat(Math.floor((count / repos.length) * 20))
      console.log(`      ${lang.padEnd(15)} ${bar} ${count}`)
    })

    console.log('═'.repeat(80))

  } catch (error: any) {
    if (error.status === 401) {
      console.error('❌ Kimlik doğrulama hatası! Token geçersiz veya süresi dolmuş olabilir.')
      console.log('\n📝 Yeni token oluşturmak için:')
      console.log('   https://github.com/settings/tokens')
    } else if (error.status === 403) {
      console.error('❌ İzin hatası! Token\'ınızın yeterli izinleri olmayabilir.')
      console.log('\n📝 Token\'a "repo" izni verdiğinizden emin olun.')
    } else {
      console.error('❌ Hata:', error.message)
    }
    process.exit(1)
  }
}

// Script'i çalıştır
listGitHubProjects()

