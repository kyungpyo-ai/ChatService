import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateRoomPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold">새 방 만들기</h1>

      <form className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">방 제목</Label>
          <Input id="title" placeholder="예: 수다온 사람들 모여라" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="max-members">최대 인원</Label>
          <Select defaultValue="20">
            <SelectTrigger id="max-members" className="w-full">
              <SelectValue placeholder="인원 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5명</SelectItem>
              <SelectItem value="10">10명</SelectItem>
              <SelectItem value="20">20명</SelectItem>
              <SelectItem value="50">50명</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">비밀번호 (선택)</Label>
          <Input id="password" type="password" placeholder="비공개방으로 만들려면 입력하세요" />
        </div>

        <Button
          type="submit"
          className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)"
        >
          방 만들기
        </Button>
      </form>
    </div>
  );
}
