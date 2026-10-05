(() => {
  // Switch this URL only after the replacement Worker domain has been verified.
  // Institution snapshot verified on 2026-10-05; used only when the API is unavailable.
  window.AXNEWS_FALLBACK_AGENCIES = [{"id": "president", "name": "总统工作部"}, {"id": "vice-president", "name": "副总统办公室"}, {"id": "government", "name": "阿谢国政府"}, {"id": "congress", "name": "阿谢国国会议事堂"}, {"id": "constitutional-court", "name": "阿谢国立宪院"}];
  window.AXNEWS_API_BASE = 'https://axnews-admin-api.axie999666.workers.dev';

  window.axieApiFetch = async function (url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const writes = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), writes ? 60000 : 10000);
    const onAbort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', onAbort, {once: true});
    try {
      return await fetch(url, {...options, signal: controller.signal});
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const reason = controller.signal.aborted ? '请求超时' : '无法连接服务';
      throw new Error(reason + (writes
        ? '，操作结果尚未确认。请先核实是否已经成功，再决定是否重试。'
        : '，请稍后重试或检查当前网络。'));
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
    }
  };
})();
