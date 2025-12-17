import { Octokit } from 'octokit'
import readline from 'readline'
import fs from 'fs'
import path from 'path'

// GitHub token'ı .env dosyasından veya kullanıcıdan al
async function getGitHubToken(): Promise<string> {
  const envPath = path.join(process.cwd(), '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/)
    if (tokenMatch && tokenMatch[1]) {
      return tokenMatch[1].trim()
    }
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('GitHub Personal Access Token giriniz: ', (token) => {
      rl.close()
      resolve(token.trim())
    })
  })
}

async function analyzeRepository(octokit: Octokit, owner: string, repo: string) {
  console.log('═'.repeat(80))
  console.log(`📊 REPO ANALİZİ: ${owner}/${repo}`)
  console.log('═'.repeat(80))
  console.log()

  try {
    // 1. Repo temel bilgileri
    console.log('📋 TEMEL BİLGİLER')
    console.log('─'.repeat(80))
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo })
    
    console.log(`   İsim: ${repoData.name}`)
    console.log(`   Tam İsim: ${repoData.full_name}`)
    console.log(`   Açıklama: ${repoData.description || 'Açıklama yok'}`)
    console.log(`   URL: ${repoData.html_url}`)
    console.log(`   Görünürlük: ${repoData.private ? '🔒 Private' : '🌐 Public'}`)
    console.log(`   Varsayılan Branch: ${repoData.default_branch}`)
    console.log(`   Dil: ${repoData.language || 'Belirlenemedi'}`)
    console.log(`   Oluşturulma: ${new Date(repoData.created_at).toLocaleDateString('tr-TR')}`)
    console.log(`   Son Güncelleme: ${new Date(repoData.updated_at).toLocaleDateString('tr-TR')}`)
    console.log(`   Son Push: ${new Date(repoData.pushed_at).toLocaleDateString('tr-TR')}`)
    console.log(`   ⭐ Yıldız: ${repoData.stargazers_count}`)
    console.log(`   👀 Watchers: ${repoData.watchers_count}`)
    console.log(`   🔀 Forks: ${repoData.forks_count}`)
    console.log(`   📄 Size: ${(repoData.size / 1024).toFixed(2)} MB`)
    console.log()

    // 2. Diller ve yüzdeleri
    console.log('💻 KULLANILAN DİLLER')
    console.log('─'.repeat(80))
    try {
      const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo })
      const total = Object.values(languages).reduce((a, b) => a + b, 0)
      const sorted = Object.entries(languages).sort(([, a], [, b]) => b - a)
      
      sorted.forEach(([lang, bytes]) => {
        const percentage = ((bytes / total) * 100).toFixed(1)
        const bar = '█'.repeat(Math.floor((bytes / total) * 20))
        console.log(`   ${lang.padEnd(20)} ${bar} ${percentage}% (${(bytes / 1024).toFixed(2)} KB)`)
      })
    } catch (e) {
      console.log('   Dil bilgisi alınamadı')
    }
    console.log()

    // 3. Branch'ler
    console.log('🌿 BRANCH\'LER')
    console.log('─'.repeat(80))
    try {
      const { data: branches } = await octokit.rest.repos.listBranches({ owner, repo })
      console.log(`   Toplam: ${branches.length} branch`)
      branches.slice(0, 10).forEach(branch => {
        console.log(`   • ${branch.name}${branch.protected ? ' 🔒' : ''}`)
      })
      if (branches.length > 10) {
        console.log(`   ... ve ${branches.length - 10} branch daha`)
      }
    } catch (e) {
      console.log('   Branch bilgisi alınamadı')
    }
    console.log()

    // 4. Son commit'ler
    console.log('📝 SON COMMIT\'LER')
    console.log('─'.repeat(80))
    try {
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 10
      })
      commits.forEach((commit, i) => {
        const date = new Date(commit.commit.author?.date || '').toLocaleDateString('tr-TR')
        const message = commit.commit.message.split('\n')[0].substring(0, 60)
        console.log(`   ${i + 1}. ${message}${message.length >= 60 ? '...' : ''}`)
        console.log(`      👤 ${commit.commit.author?.name || 'Bilinmiyor'} - ${date}`)
      })
    } catch (e) {
      console.log('   Commit bilgisi alınamadı')
    }
    console.log()

    // 5. Issues
    console.log('🐛 ISSUES')
    console.log('─'.repeat(80))
    try {
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        per_page: 100
      })
      const openIssues = issues.filter(i => !i.pull_request && i.state === 'open')
      const closedIssues = issues.filter(i => !i.pull_request && i.state === 'closed')
      console.log(`   Açık: ${openIssues.length}`)
      console.log(`   Kapalı: ${closedIssues.length}`)
      console.log(`   Toplam: ${openIssues.length + closedIssues.length}`)
      
      if (openIssues.length > 0) {
        console.log(`\n   Son Açık Issues:`)
        openIssues.slice(0, 5).forEach(issue => {
          const date = new Date(issue.created_at).toLocaleDateString('tr-TR')
          console.log(`   • #${issue.number}: ${issue.title.substring(0, 50)} (${date})`)
        })
      }
    } catch (e) {
      console.log('   Issue bilgisi alınamadı')
    }
    console.log()

    // 6. Pull Requests
    console.log('🔀 PULL REQUESTS')
    console.log('─'.repeat(80))
    try {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'all',
        per_page: 100
      })
      const openPRs = pulls.filter(pr => pr.state === 'open')
      const closedPRs = pulls.filter(pr => pr.state === 'closed')
      const mergedPRs = pulls.filter(pr => pr.merged_at)
      console.log(`   Açık: ${openPRs.length}`)
      console.log(`   Kapalı: ${closedPRs.length}`)
      console.log(`   Merge Edilmiş: ${mergedPRs.length}`)
      console.log(`   Toplam: ${pulls.length}`)
      
      if (openPRs.length > 0) {
        console.log(`\n   Açık PR'ler:`)
        openPRs.slice(0, 5).forEach(pr => {
          const date = new Date(pr.created_at).toLocaleDateString('tr-TR')
          console.log(`   • #${pr.number}: ${pr.title.substring(0, 50)} (${date})`)
        })
      }
    } catch (e) {
      console.log('   PR bilgisi alınamadı')
    }
    console.log()

    // 7. Contributors
    console.log('👥 KATKIDA BULUNANLAR')
    console.log('─'.repeat(80))
    try {
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 20
      })
      console.log(`   Toplam: ${contributors.length} katkıda bulunan`)
      contributors.slice(0, 10).forEach((contributor, i) => {
        console.log(`   ${i + 1}. ${contributor.login}: ${contributor.contributions} katkı`)
      })
    } catch (e) {
      console.log('   Contributor bilgisi alınamadı')
    }
    console.log()

    // 8. Releases
    console.log('📦 RELEASES')
    console.log('─'.repeat(80))
    try {
      const { data: releases } = await octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: 10
      })
      if (releases.length > 0) {
        console.log(`   Toplam: ${releases.length} release`)
        releases.slice(0, 5).forEach(release => {
          const date = new Date(release.published_at || release.created_at).toLocaleDateString('tr-TR')
          console.log(`   • ${release.tag_name}: ${release.name || 'İsimsiz'} (${date})`)
        })
      } else {
        console.log('   Henüz release yok')
      }
    } catch (e) {
      console.log('   Release bilgisi alınamadı')
    }
    console.log()

    // 9. Dosya yapısı (tree)
    console.log('📁 PROJE YAPISI')
    console.log('─'.repeat(80))
    try {
      const { data: ref } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${repoData.default_branch}`
      })
      const { data: commit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: ref.object.sha
      })
      const { data: tree } = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: commit.tree.sha,
        recursive: '1'
      })
      
      const files = tree.tree.filter(item => item.type === 'blob')
      const dirs = tree.tree.filter(item => item.type === 'tree')
      
      console.log(`   Dosyalar: ${files.length}`)
      console.log(`   Klasörler: ${dirs.length}`)
      console.log(`   Toplam: ${tree.tree.length} öğe`)
      
      // Önemli dosyaları göster
      const importantFiles = files.filter(f => {
        const name = f.path?.toLowerCase() || ''
        return name.includes('package.json') || 
               name.includes('readme') || 
               name.includes('license') ||
               name.includes('dockerfile') ||
               name.includes('.gitignore') ||
               name.includes('tsconfig') ||
               name.includes('vite.config')
      })
      
      if (importantFiles.length > 0) {
        console.log(`\n   Önemli Dosyalar:`)
        importantFiles.forEach(file => {
          console.log(`   • ${file.path}`)
        })
      }
    } catch (e) {
      console.log('   Dosya yapısı alınamadı')
    }
    console.log()

    // 10. Özet istatistikler
    console.log('═'.repeat(80))
    console.log('📈 ÖZET İSTATİSTİKLER')
    console.log('═'.repeat(80))
    console.log(`   ⭐ Yıldız: ${repoData.stargazers_count}`)
    console.log(`   👀 Watchers: ${repoData.watchers_count}`)
    console.log(`   🔀 Forks: ${repoData.forks_count}`)
    console.log(`   📄 Proje Boyutu: ${(repoData.size / 1024).toFixed(2)} MB`)
    console.log(`   📅 Yaş: ${Math.floor((Date.now() - new Date(repoData.created_at).getTime()) / (1000 * 60 * 60 * 24))} gün`)
    console.log(`   🔄 Son Aktivite: ${Math.floor((Date.now() - new Date(repoData.pushed_at).getTime()) / (1000 * 60 * 60 * 24))} gün önce`)
    console.log('═'.repeat(80))

  } catch (error: any) {
    if (error.status === 404) {
      console.error(`❌ Repo bulunamadı: ${owner}/${repo}`)
    } else {
      console.error(`❌ Hata: ${error.message}`)
    }
    throw error
  }
}

async function findAndAnalyzeRepo() {
  try {
    console.log('🔗 GitHub hesabınıza bağlanılıyor...\n')

    const token = await getGitHubToken()

    if (!token) {
      console.error('❌ GitHub token gerekli!')
      process.exit(1)
    }

    const octokit = new Octokit({ auth: token })

    // Kullanıcı bilgilerini al
    const { data: user } = await octokit.rest.users.getAuthenticated()
    console.log(`✅ Bağlantı başarılı! Kullanıcı: ${user.login}\n`)

    // "erre" reposunu bul
    console.log('🔍 "erre" projesi aranıyor...\n')
    
    let repoFound = null
    
    // Önce kullanıcının repolarında ara
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100
    })
    
    repoFound = repos.find(repo => repo.name.toLowerCase() === 'erre')
    
    // Bulunamazsa, kullanıcı adıyla dene
    if (!repoFound) {
      try {
        const { data: repo } = await octokit.rest.repos.get({
          owner: user.login,
          repo: 'erre'
        })
        repoFound = repo
      } catch (e) {
        // Repo bulunamadı
      }
    }

    if (!repoFound) {
      console.error('❌ "erre" projesi bulunamadı!')
      console.log('\n📋 Mevcut projeleriniz:')
      repos.slice(0, 10).forEach(repo => {
        console.log(`   • ${repo.name}`)
      })
      if (repos.length > 10) {
        console.log(`   ... ve ${repos.length - 10} proje daha`)
      }
      process.exit(1)
    }

    console.log(`✅ "erre" projesi bulundu: ${repoFound.full_name}\n`)

    // Repoyu analiz et
    await analyzeRepository(octokit, repoFound.owner.login, repoFound.name)

  } catch (error: any) {
    if (error.status === 401) {
      console.error('❌ Kimlik doğrulama hatası! Token geçersiz.')
    } else if (error.status === 403) {
      console.error('❌ İzin hatası! Token\'ınızın yeterli izinleri yok.')
    } else {
      console.error('❌ Hata:', error.message)
    }
    process.exit(1)
  }
}

// Script'i çalıştır
findAndAnalyzeRepo()


