import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Users,
  UserCheck,
  Loader2,
  CheckCircle2,
  X,
  Trash2,
  Crown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";
import { getPublicArtistsApi } from "#/api/artist";
import { addSongArtistApi, removeSongArtistApi } from "#/api/catalog";

const ROLE_OPTIONS = [
  { value: "FEATURED", label: "Hát chung (Featured)", desc: "Góp giọng trong bài hát" },
  { value: "PRODUCER", label: "Sản xuất (Producer)", desc: "Người sản xuất âm nhạc" },
];

export const SongArtistModal = ({ isOpen, onClose, song }) => {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedRole, setSelectedRole] = useState("FEATURED");

  // Danh sách nghệ sĩ đang tham gia (đồng bộ từ song.artists)
  const [currentArtists, setCurrentArtists] = useState([]);

  // Debounce tìm kiếm 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Đồng bộ danh sách nghệ sĩ khi mở modal
  useEffect(() => {
    if (song && isOpen) {
      setCurrentArtists(song.artists || []);
      setKeyword("");
      setDebouncedKeyword("");
      setSelectedArtist(null);
      setSelectedRole("FEATURED");
    }
  }, [song, isOpen]);

  // Tìm kiếm nghệ sĩ công khai
  const { data: artistsRes, isLoading: isSearching } = useQuery({
    queryKey: ["publicArtists", debouncedKeyword],
    queryFn: () =>
      getPublicArtistsApi({
        keyword: debouncedKeyword || undefined,
        page: 0,
        size: 10,
      }),
    enabled: isOpen && !!debouncedKeyword,
    staleTime: 1000 * 60 * 2,
  });

  const searchResults = artistsRes?.data?.content || [];

  // Mutation thêm nghệ sĩ hợp tác
  const addMutation = useMutation({
    mutationFn: () =>
      addSongArtistApi(song.id, {
        artistId: selectedArtist.id,
        role: selectedRole,
      }),
    onSuccess: () => {
      toast.success("Thêm nghệ sĩ hợp tác thành công!", {
        description: `Đã thêm ${selectedArtist.stageName} với vai trò ${selectedRole}.`,
      });

      // Cập nhật state danh sách cục bộ
      setCurrentArtists((prev) => [
        ...prev,
        {
          artistId: selectedArtist.id,
          artistName: selectedArtist.stageName,
          role: selectedRole,
        },
      ]);

      setSelectedArtist(null);
      setKeyword("");
      setDebouncedKeyword("");

      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
    },
    onError: (err) => {
      toast.error("Thêm thất bại", {
        description:
          err.response?.data?.message || "Nghệ sĩ có thể đã tồn tại trong bài hát này.",
      });
    },
  });

  // Mutation gỡ nghệ sĩ hợp tác
  const removeMutation = useMutation({
    mutationFn: (artistId) => removeSongArtistApi(song.id, artistId),
    onSuccess: (_, artistId) => {
      toast.success("Đã gỡ nghệ sĩ khỏi bài hát!");
      setCurrentArtists((prev) => prev.filter((a) => a.artistId !== artistId));

      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
    },
    onError: (err) => {
      toast.error("Gỡ nghệ sĩ thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  const handleRemoveArtist = (artist) => {
    if (confirm(`Bạn có chắc muốn gỡ nghệ sĩ "${artist.artistName}" khỏi bài hát này không?`)) {
      removeMutation.mutate(artist.artistId);
    }
  };

  if (!song) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quản lý nghệ sĩ hợp tác"
      description={`Mời và quản lý các nghệ sĩ tham gia góp giọng, sản xuất cho bài "${song.title}".`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 pt-1 max-h-[75vh] overflow-y-auto scrollbar-thin pr-1">
        {/* ── THÔNG TIN BÀI HÁT HIỆN TẠI ── */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 shadow-md">
            <CoverImage
              src={song.coverImage}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{song.title}</p>
            <p className="text-xs text-neutral-400 truncate mt-0.5">
              Chủ sở hữu: <span className="text-white font-medium">{song.ownerName}</span>
            </p>
          </div>
        </div>

        {/* ── SECTION 1: DANH SÁCH NGHỆ SĨ ĐANG THAM GIA ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users size={14} className="text-[#fa2d48]" />
              Nghệ sĩ tham gia ({currentArtists.length})
            </label>
            <span className="text-[11px] text-neutral-500">Chủ bài hát & Nghệ sĩ phụ</span>
          </div>

          <div className="divide-y divide-white/[0.04] rounded-2xl bg-[#161616] border border-white/[0.05] overflow-hidden">
            {currentArtists.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500">
                Chưa có nghệ sĩ nào được ghi nhận
              </div>
            ) : (
              currentArtists.map((a, idx) => {
                const isMain = a.role === "MAIN";
                return (
                  <div
                    key={a.artistId || idx}
                    className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {isMain ? <Crown size={14} className="text-amber-400" /> : <Users size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {a.artistName || "Nghệ sĩ"}
                        </p>
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold mt-0.5 ${
                            isMain
                              ? "bg-amber-400/15 text-amber-300"
                              : a.role === "PRODUCER"
                              ? "bg-purple-500/15 text-purple-300"
                              : "bg-sky-500/15 text-sky-300"
                          }`}
                        >
                          {isMain
                            ? "Chính (Main Artist)"
                            : a.role === "PRODUCER"
                            ? "Sản xuất (Producer)"
                            : "Hát chung (Featured)"}
                        </span>
                      </div>
                    </div>

                    {!isMain && (
                      <button
                        type="button"
                        onClick={() => handleRemoveArtist(a)}
                        disabled={removeMutation.isPending}
                        className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer flex-shrink-0"
                        title="Gỡ nghệ sĩ khỏi bài hát"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── SECTION 2: THÊM NGHỆ SĨ HỢP TÁC MỚI ── */}
        <div className="space-y-3.5 pt-2 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles size={14} className="text-[#fa2d48]" />
              Mời nghệ sĩ hợp tác mới
            </h4>
          </div>

          {/* Chọn vai trò */}
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === r.value
                    ? "border-[#fa2d48] bg-[#fa2d48]/10"
                    : "border-neutral-700/60 hover:border-neutral-500 bg-[#1e1e1e]"
                }`}
              >
                <p className={`text-xs font-bold ${selectedRole === r.value ? "text-[#fa2d48]" : "text-white"}`}>
                  {r.label}
                </p>
                <p className="text-[10px] text-neutral-400 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm nghệ sĩ */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Nhập nghệ danh để tìm kiếm trên hệ thống..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-[#202020] hover:bg-[#252525] focus:bg-[#252525] text-white placeholder-neutral-500 text-xs rounded-xl pl-10 pr-9 py-3 outline-none border border-neutral-700/60 focus:border-white/60 transition-all"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  setSelectedArtist(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Danh sách kết quả tìm kiếm */}
          {debouncedKeyword && (
            <div className="max-h-[180px] overflow-y-auto scrollbar-thin rounded-2xl bg-[#181818] border border-white/[0.06] divide-y divide-white/[0.03]">
              {isSearching ? (
                <div className="flex items-center justify-center py-6 gap-2 text-neutral-500 text-xs">
                  <Loader2 size={15} className="animate-spin text-[#fa2d48]" />
                  Đang tìm nghệ sĩ...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500">
                  Không tìm thấy nghệ sĩ nào khớp với "{debouncedKeyword}"
                </div>
              ) : (
                searchResults.map((artist) => {
                  const isSelected = selectedArtist?.id === artist.id;
                  const isAlreadyAdded = currentArtists.some(
                    (a) => a.artistId === artist.id
                  );

                  return (
                    <button
                      key={artist.id}
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => setSelectedArtist(isSelected ? null : artist)}
                      className={`w-full flex items-center justify-between p-3 text-left transition-all ${
                        isAlreadyAdded
                          ? "opacity-40 cursor-not-allowed bg-black/20"
                          : isSelected
                          ? "bg-[#fa2d48]/15 cursor-pointer"
                          : "hover:bg-white/[0.03] cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800">
                          <CoverImage
                            src={artist.avatarUrl}
                            alt={artist.stageName}
                            className="w-full h-full object-cover"
                            isArtist
                          />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? "text-[#fa2d48]" : "text-white"}`}>
                            {artist.stageName}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {artist.followerCount?.toLocaleString() || 0} người theo dõi
                          </p>
                        </div>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="text-[10px] text-neutral-500 font-semibold px-2 py-0.5 rounded bg-neutral-800">
                          Đã tham gia
                        </span>
                      ) : isSelected ? (
                        <CheckCircle2 size={16} className="text-[#fa2d48]" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* Nghệ sĩ đã chọn để thêm */}
          {selectedArtist && (
            <div className="p-3 rounded-xl bg-[#fa2d48]/10 border border-[#fa2d48]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserCheck size={16} className="text-[#fa2d48] flex-shrink-0" />
                <p className="text-xs text-white truncate">
                  Chuẩn bị thêm <strong className="text-[#fa2d48]">{selectedArtist.stageName}</strong> với vai trò{" "}
                  <strong>{ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}</strong>
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={addMutation.isPending}
                onClick={() => addMutation.mutate()}
                className="flex-shrink-0"
              >
                Xác nhận thêm
              </Button>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-end pt-3 border-t border-white/[0.05]">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SongArtistModal;
