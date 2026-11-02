import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, UserCheck, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";
import { getPublicArtistsApi } from "#/api/artist";
import { addSongArtistApi } from "#/api/catalog";

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

  // Debounce tìm kiếm 400ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Reset state khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setKeyword("");
      setDebouncedKeyword("");
      setSelectedArtist(null);
      setSelectedRole("FEATURED");
    }
  }, [isOpen]);

  // Tìm kiếm nghệ sĩ công khai
  const { data: artistsRes, isLoading } = useQuery({
    queryKey: ["publicArtists", debouncedKeyword],
    queryFn: () => getPublicArtistsApi({ keyword: debouncedKeyword || undefined, page: 0, size: 10 }),
    enabled: isOpen,
    staleTime: 1000 * 60 * 2,
  });

  const artists = artistsRes?.data?.content || [];

  // Mutation thêm nghệ sĩ hợp tác
  const mutation = useMutation({
    mutationFn: () => addSongArtistApi(song.id, { artistId: selectedArtist.id, role: selectedRole }),
    onSuccess: () => {
      toast.success("Thêm nghệ sĩ hợp tác thành công!", {
        description: `Đã thêm ${selectedArtist.stageName} với vai trò ${selectedRole}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
      onClose();
    },
    onError: (err) => {
      toast.error("Thêm thất bại", {
        description: err.response?.data?.message || "Nghệ sĩ có thể đã tồn tại trong bài hát này.",
      });
    },
  });

  if (!song) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm nghệ sĩ hợp tác"
      description={`Tìm kiếm và mời nghệ sĩ khác trong hệ thống tham gia bài "${song.title}".`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5 pt-1">
        {/* Thông tin bài hát hiện tại */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
            <CoverImage
              src={song.coverImage}
              alt={song.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-sm truncate">{song.title}</p>
            <p className="text-xs text-neutral-400 truncate">{song.ownerName} (Nghệ sĩ chính)</p>
          </div>
        </div>

        {/* Chọn vai trò TRƯỚC khi tìm kiếm */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">Vai trò hợp tác</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRole === r.value
                    ? "border-[#fa2d48] bg-[#fa2d48]/10"
                    : "border-neutral-700 hover:border-neutral-500 bg-[#1e1e1e]"
                }`}
              >
                <p className={`text-xs font-bold ${selectedRole === r.value ? "text-[#fa2d48]" : "text-white"}`}>
                  {r.label}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Ô tìm kiếm nghệ sĩ */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-300">Tìm kiếm nghệ sĩ</label>
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Nhập nghệ danh để tìm kiếm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-[#242424] hover:bg-[#282828] focus:bg-[#282828] text-white placeholder-neutral-500 text-sm rounded-xl pl-10 pr-4 py-3 outline-none border border-neutral-700/60 focus:border-white/80 transition-all duration-200"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => { setKeyword(""); setSelectedArtist(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Danh sách kết quả tìm kiếm */}
        <div className="min-h-[200px] max-h-[240px] overflow-y-auto scrollbar-thin rounded-xl bg-[#1a1a1a] border border-white/[0.04]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-10 gap-2 text-neutral-500 text-xs">
              <Loader2 size={16} className="animate-spin" />
              Đang tìm kiếm...
            </div>
          ) : artists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-500">
              <Users size={24} />
              <p className="text-xs">
                {debouncedKeyword ? `Không tìm thấy nghệ sĩ nào cho "${debouncedKeyword}"` : "Nhập nghệ danh để tìm kiếm"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {artists.map((artist) => {
                const isSelected = selectedArtist?.id === artist.id;
                return (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => setSelectedArtist(isSelected ? null : artist)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#fa2d48]/10"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800">
                      <CoverImage
                        src={artist.avatarUrl}
                        alt={artist.stageName}
                        className="w-full h-full object-cover"
                        isArtist
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? "text-[#fa2d48]" : "text-white"}`}>
                        {artist.stageName}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {artist.followerCount?.toLocaleString() || 0} người theo dõi
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="text-[#fa2d48] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Nghệ sĩ đã chọn – preview xác nhận */}
        {selectedArtist && (
          <div className="p-3 rounded-xl bg-[#fa2d48]/10 border border-[#fa2d48]/30 flex items-center gap-3">
            <UserCheck size={16} className="text-[#fa2d48] flex-shrink-0" />
            <p className="text-sm text-white">
              Thêm{" "}
              <span className="font-bold text-[#fa2d48]">{selectedArtist.stageName}</span>
              {" "}với vai trò{" "}
              <span className="font-bold text-white">
                {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label}
              </span>
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.05]">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!selectedArtist}
            isLoading={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="px-8"
          >
            <Users size={16} />
            Thêm hợp tác
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SongArtistModal;
